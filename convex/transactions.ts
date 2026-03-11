import { v } from "convex/values";
import { query, mutation } from "./_generated/server.js";
import { getAuthenticatedUser } from "./helpers.js";

// ─── Queries ────────────────────────────────────────────────────────────────

export const list = query({
  args: {
    type: v.optional(v.string()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = user.householdId;
    if (!householdId) return { transactions: [], nextCursor: null, hasMore: false };

    const limit = args.limit ?? 20;

    let q;
    if (args.type) {
      q = ctx.db
        .query("transactions")
        .withIndex("by_household_type", (idx) =>
          idx.eq("householdId", householdId).eq("type", args.type!),
        );
    } else {
      q = ctx.db
        .query("transactions")
        .withIndex("by_household", (idx) =>
          idx.eq("householdId", householdId),
        );
    }

    const all = await q.order("desc").collect();

    let filtered = all;
    if (args.search) {
      const term = args.search.toLowerCase();
      filtered = all.filter(
        (t) =>
          t.description.toLowerCase().includes(term) ||
          (t.notes && t.notes.toLowerCase().includes(term)),
      );
    }

    const cursorIndex = args.cursor
      ? filtered.findIndex((t) => t._id === args.cursor) + 1
      : 0;

    const page = filtered.slice(cursorIndex, cursorIndex + limit);
    const hasMore = cursorIndex + limit < filtered.length;
    const nextCursor = hasMore ? page[page.length - 1]?._id ?? null : null;

    const transactions = await Promise.all(
      page.map(async (t) => {
        const account = await ctx.db.get(t.accountId);
        const category = t.categoryId ? await ctx.db.get(t.categoryId) : null;
        return {
          ...t,
          accountName: account?.name ?? "Unknown",
          categoryName: category?.name ?? null,
          categoryColor: category?.color ?? null,
        };
      }),
    );

    return { transactions, nextCursor, hasMore };
  },
});

export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = user.householdId;
    if (!householdId)
      return { total: 0, incomeTotal: 0, expenseTotal: 0 };

    const all = await ctx.db
      .query("transactions")
      .withIndex("by_household", (idx) => idx.eq("householdId", householdId))
      .collect();

    let incomeTotal = 0;
    let expenseTotal = 0;
    for (const t of all) {
      if (t.type === "income") incomeTotal += t.amount;
      else if (t.type === "expense") expenseTotal += t.amount;
    }

    return { total: all.length, incomeTotal, expenseTotal };
  },
});

// ─── Mutations ──────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    accountId: v.id("accounts"),
    type: v.string(),
    amount: v.number(),
    currency: v.string(),
    description: v.string(),
    categoryId: v.optional(v.id("categories")),
    merchantId: v.optional(v.id("merchants")),
    date: v.string(),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.id("tags"))),
    transferToAccountId: v.optional(v.id("accounts")),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = user.householdId;
    if (!householdId) throw new Error("No household");

    const account = await ctx.db.get(args.accountId);
    if (!account || account.householdId !== householdId)
      throw new Error("Account not found");

    const txId = await ctx.db.insert("transactions", {
      householdId,
      accountId: args.accountId,
      type: args.type,
      amount: args.amount,
      currency: args.currency,
      description: args.description,
      categoryId: args.categoryId,
      merchantId: args.merchantId,
      date: args.date,
      notes: args.notes,
      tags: args.tags,
      transferToAccountId: args.transferToAccountId,
      createdBy: user._id,
      source: args.source,
    });

    const balanceDelta =
      args.type === "income"
        ? args.amount
        : args.type === "expense"
          ? -args.amount
          : -args.amount; // transfer: subtract from source

    await ctx.db.patch(args.accountId, {
      balance: account.balance + balanceDelta,
    });

    await ctx.db.insert("accountBalanceHistory", {
      accountId: args.accountId,
      balance: account.balance + balanceDelta,
      date: args.date,
    });

    if (args.type === "transfer" && args.transferToAccountId) {
      const toAccount = await ctx.db.get(args.transferToAccountId);
      if (toAccount && toAccount.householdId === householdId) {
        await ctx.db.patch(args.transferToAccountId, {
          balance: toAccount.balance + args.amount,
        });
        await ctx.db.insert("accountBalanceHistory", {
          accountId: args.transferToAccountId,
          balance: toAccount.balance + args.amount,
          date: args.date,
        });
      }
    }

    return txId;
  },
});

export const update = mutation({
  args: {
    id: v.id("transactions"),
    accountId: v.optional(v.id("accounts")),
    type: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    merchantId: v.optional(v.id("merchants")),
    date: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.id("tags"))),
    transferToAccountId: v.optional(v.id("accounts")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = user.householdId;
    if (!householdId) throw new Error("No household");

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.householdId !== householdId)
      throw new Error("Transaction not found");

    const oldAccount = await ctx.db.get(existing.accountId);
    if (!oldAccount) throw new Error("Account not found");

    const oldDelta =
      existing.type === "income"
        ? existing.amount
        : existing.type === "expense"
          ? -existing.amount
          : -existing.amount;
    await ctx.db.patch(existing.accountId, {
      balance: oldAccount.balance - oldDelta,
    });

    const newType = args.type ?? existing.type;
    const newAmount = args.amount ?? existing.amount;
    const newAccountId = args.accountId ?? existing.accountId;

    const newAccount =
      newAccountId === existing.accountId
        ? { ...oldAccount, balance: oldAccount.balance - oldDelta }
        : await ctx.db.get(newAccountId);
    if (!newAccount) throw new Error("New account not found");

    const newDelta =
      newType === "income"
        ? newAmount
        : newType === "expense"
          ? -newAmount
          : -newAmount;

    const updatedBalance =
      newAccountId === existing.accountId
        ? oldAccount.balance - oldDelta + newDelta
        : newAccount.balance + newDelta;

    await ctx.db.patch(newAccountId, { balance: updatedBalance });

    const date = args.date ?? existing.date;
    await ctx.db.insert("accountBalanceHistory", {
      accountId: newAccountId,
      balance: updatedBalance,
      date,
    });

    const { id: _id, ...patch } = args;
    await ctx.db.patch(args.id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = user.householdId;
    if (!householdId) throw new Error("No household");

    const tx = await ctx.db.get(args.id);
    if (!tx || tx.householdId !== householdId)
      throw new Error("Transaction not found");

    const account = await ctx.db.get(tx.accountId);
    if (account) {
      const delta =
        tx.type === "income"
          ? tx.amount
          : tx.type === "expense"
            ? -tx.amount
            : -tx.amount;
      await ctx.db.patch(tx.accountId, {
        balance: account.balance - delta,
      });
      await ctx.db.insert("accountBalanceHistory", {
        accountId: tx.accountId,
        balance: account.balance - delta,
        date: new Date().toISOString().split("T")[0]!,
      });
    }

    if (tx.type === "transfer" && tx.transferToAccountId) {
      const toAccount = await ctx.db.get(tx.transferToAccountId);
      if (toAccount) {
        await ctx.db.patch(tx.transferToAccountId, {
          balance: toAccount.balance - tx.amount,
        });
        await ctx.db.insert("accountBalanceHistory", {
          accountId: tx.transferToAccountId,
          balance: toAccount.balance - tx.amount,
          date: new Date().toISOString().split("T")[0]!,
        });
      }
    }

    await ctx.db.delete(args.id);
  },
});

export const bulkDelete = mutation({
  args: { ids: v.array(v.id("transactions")) },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = user.householdId;
    if (!householdId) throw new Error("No household");

    for (const id of args.ids) {
      const tx = await ctx.db.get(id);
      if (!tx || tx.householdId !== householdId) continue;

      const account = await ctx.db.get(tx.accountId);
      if (account) {
        const delta =
          tx.type === "income"
            ? tx.amount
            : tx.type === "expense"
              ? -tx.amount
              : -tx.amount;
        await ctx.db.patch(tx.accountId, {
          balance: account.balance - delta,
        });
        await ctx.db.insert("accountBalanceHistory", {
          accountId: tx.accountId,
          balance: account.balance - delta,
          date: new Date().toISOString().split("T")[0]!,
        });
      }

      if (tx.type === "transfer" && tx.transferToAccountId) {
        const toAccount = await ctx.db.get(tx.transferToAccountId);
        if (toAccount) {
          await ctx.db.patch(tx.transferToAccountId, {
            balance: toAccount.balance - tx.amount,
          });
          await ctx.db.insert("accountBalanceHistory", {
            accountId: tx.transferToAccountId,
            balance: toAccount.balance - tx.amount,
            date: new Date().toISOString().split("T")[0]!,
          });
        }
      }

      await ctx.db.delete(id);
    }
  },
});
