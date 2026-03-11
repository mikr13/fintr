import { v } from "convex/values";
import { query, mutation } from "./_generated/server.js";
import { getAuthenticatedUser } from "./helpers.js";

// ─── Queries ────────────────────────────────────────────────────────────────

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = user.householdId;
    if (!householdId) return [];

    return await ctx.db
      .query("accounts")
      .withIndex("by_household", (q) => q.eq("householdId", householdId))
      .collect();
  },
});

export const getNetWorth = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = user.householdId;
    if (!householdId) return { total: 0, assetsTotal: 0, debtsTotal: 0 };

    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_household", (q) => q.eq("householdId", householdId))
      .collect();

    let assetsTotal = 0;
    let debtsTotal = 0;

    for (const account of accounts) {
      if (account.isDebt) {
        debtsTotal += Math.abs(account.balance);
      } else {
        assetsTotal += account.balance;
      }
    }

    return {
      total: assetsTotal - debtsTotal,
      assetsTotal,
      debtsTotal,
    };
  },
});

export const getNetWorthHistory = query({
  args: {
    days: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = user.householdId;
    if (!householdId) return [];

    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_household", (q) => q.eq("householdId", householdId))
      .collect();

    if (accounts.length === 0) return [];

    const cutoffDate =
      args.days === -1
        ? null
        : new Date(Date.now() - args.days * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];

    const allHistory: Array<{
      date: string;
      balance: number;
      isDebt: boolean;
    }> = [];

    for (const account of accounts) {
      const entries = await ctx.db
        .query("accountBalanceHistory")
        .withIndex("by_account", (q) => q.eq("accountId", account._id))
        .collect();

      for (const entry of entries) {
        if (cutoffDate && entry.date < cutoffDate) continue;
        allHistory.push({
          date: entry.date,
          balance: entry.balance,
          isDebt: account.isDebt,
        });
      }
    }

    const dateMap = new Map<string, number>();
    for (const entry of allHistory) {
      const current = dateMap.get(entry.date) ?? 0;
      dateMap.set(
        entry.date,
        current + (entry.isDebt ? -Math.abs(entry.balance) : entry.balance),
      );
    }

    return Array.from(dateMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const get = query({
  args: { accountId: v.id("accounts") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = user.householdId;
    if (!householdId) return null;

    const account = await ctx.db.get(args.accountId);
    if (!account || account.householdId !== householdId) return null;
    return account;
  },
});

export const getBalanceHistory = query({
  args: {
    accountId: v.id("accounts"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = user.householdId;
    if (!householdId) return [];

    const account = await ctx.db.get(args.accountId);
    if (!account || account.householdId !== householdId) return [];

    const entries = await ctx.db
      .query("accountBalanceHistory")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .collect();

    const days = args.days ?? 30;
    const cutoffDate =
      days === -1
        ? null
        : new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];

    return entries
      .filter((e) => !cutoffDate || e.date >= cutoffDate)
      .map((e) => ({ date: e.date, balance: e.balance }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

// ─── Mutations ──────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    subtype: v.optional(v.string()),
    balance: v.number(),
    currency: v.string(),
    isDebt: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = user.householdId;
    if (!householdId) throw new Error("No household");

    const accountId = await ctx.db.insert("accounts", {
      householdId,
      name: args.name,
      type: args.type,
      subtype: args.subtype,
      balance: args.balance,
      currency: args.currency,
      isDebt: args.isDebt,
      createdBy: user._id,
    });

    const today = new Date().toISOString().split("T")[0]!;
    await ctx.db.insert("accountBalanceHistory", {
      accountId,
      balance: args.balance,
      date: today,
    });

    return accountId;
  },
});

export const updateBalance = mutation({
  args: {
    accountId: v.id("accounts"),
    balance: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = user.householdId;
    if (!householdId) throw new Error("No household");

    const account = await ctx.db.get(args.accountId);
    if (!account || account.householdId !== householdId) {
      throw new Error("Account not found");
    }

    await ctx.db.patch(args.accountId, { balance: args.balance });

    const today = new Date().toISOString().split("T")[0]!;

    const existingEntry = await ctx.db
      .query("accountBalanceHistory")
      .withIndex("by_account_date", (q) =>
        q.eq("accountId", args.accountId).eq("date", today),
      )
      .first();

    if (existingEntry) {
      await ctx.db.patch(existingEntry._id, { balance: args.balance });
    } else {
      await ctx.db.insert("accountBalanceHistory", {
        accountId: args.accountId,
        balance: args.balance,
        date: today,
      });
    }
  },
});

export const update = mutation({
  args: {
    accountId: v.id("accounts"),
    name: v.optional(v.string()),
    subtype: v.optional(v.string()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = user.householdId;
    if (!householdId) throw new Error("No household");

    const account = await ctx.db.get(args.accountId);
    if (!account || account.householdId !== householdId) {
      throw new Error("Account not found");
    }

    const updates: Record<string, string> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.subtype !== undefined) updates.subtype = args.subtype;
    if (args.currency !== undefined) updates.currency = args.currency;

    await ctx.db.patch(args.accountId, updates);
  },
});

export const remove = mutation({
  args: {
    accountId: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = user.householdId;
    if (!householdId) throw new Error("No household");

    const account = await ctx.db.get(args.accountId);
    if (!account || account.householdId !== householdId) {
      throw new Error("Account not found");
    }

    const historyEntries = await ctx.db
      .query("accountBalanceHistory")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .collect();

    for (const entry of historyEntries) {
      await ctx.db.delete(entry._id);
    }

    await ctx.db.delete(args.accountId);
  },
});
