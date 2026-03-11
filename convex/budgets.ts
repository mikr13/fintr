import { v } from "convex/values";
import { query, mutation } from "./_generated/server.js";
import type { Id } from "./_generated/dataModel.js";
import { getAuthenticatedUser } from "./helpers.js";

function getHouseholdId(user: Record<string, unknown>): Id<"households"> {
  const householdId = user.householdId as Id<"households"> | undefined;
  if (!householdId) throw new Error("No household");
  return householdId;
}

function getMonthDateRange(month: number, year: number) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate };
}

export const listForMonth = query({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = (user as Record<string, unknown>)
      .householdId as Id<"households"> | undefined;
    if (!householdId) return [];

    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_household_period", (q) =>
        q
          .eq("householdId", householdId)
          .eq("year", args.year)
          .eq("month", args.month),
      )
      .collect();

    const { startDate, endDate } = getMonthDateRange(args.month, args.year);

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_household_date", (q) =>
        q
          .eq("householdId", householdId)
          .gte("date", startDate)
          .lte("date", endDate),
      )
      .collect();

    const expenseTransactions = transactions.filter((t) => t.type === "expense");

    const spentByCategory = new Map<string, number>();
    for (const t of expenseTransactions) {
      if (t.categoryId) {
        const current = spentByCategory.get(t.categoryId) ?? 0;
        spentByCategory.set(t.categoryId, current + Math.abs(t.amount));
      }
    }

    const result = await Promise.all(
      budgets.map(async (budget) => {
        const category = await ctx.db.get(budget.categoryId);
        return {
          ...budget,
          category: category
            ? {
                _id: category._id,
                name: category.name,
                icon: category.icon,
                color: category.color,
                type: category.type,
              }
            : null,
          spent: spentByCategory.get(budget.categoryId) ?? 0,
        };
      }),
    );

    return result;
  },
});

export const getSummary = query({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = (user as Record<string, unknown>)
      .householdId as Id<"households"> | undefined;
    if (!householdId) {
      return {
        totalBudgeted: 0,
        totalSpent: 0,
        remaining: 0,
        incomeTotal: 0,
        expenseTotal: 0,
      };
    }

    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_household_period", (q) =>
        q
          .eq("householdId", householdId)
          .eq("year", args.year)
          .eq("month", args.month),
      )
      .collect();

    const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);

    const { startDate, endDate } = getMonthDateRange(args.month, args.year);

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_household_date", (q) =>
        q
          .eq("householdId", householdId)
          .gte("date", startDate)
          .lte("date", endDate),
      )
      .collect();

    let incomeTotal = 0;
    let expenseTotal = 0;

    for (const t of transactions) {
      if (t.type === "income") {
        incomeTotal += Math.abs(t.amount);
      } else if (t.type === "expense") {
        expenseTotal += Math.abs(t.amount);
      }
    }

    return {
      totalBudgeted,
      totalSpent: expenseTotal,
      remaining: totalBudgeted - expenseTotal,
      incomeTotal,
      expenseTotal,
    };
  },
});

export const create = mutation({
  args: {
    categoryId: v.id("categories"),
    amount: v.number(),
    month: v.number(),
    year: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = getHouseholdId(user as Record<string, unknown>);

    const category = await ctx.db.get(args.categoryId);
    if (!category || category.householdId !== householdId) {
      throw new Error("Category not found");
    }

    const existing = await ctx.db
      .query("budgets")
      .withIndex("by_household_period", (q) =>
        q
          .eq("householdId", householdId)
          .eq("year", args.year)
          .eq("month", args.month),
      )
      .filter((q) => q.eq(q.field("categoryId"), args.categoryId))
      .first();

    if (existing) {
      throw new Error("Budget already exists for this category and period");
    }

    return await ctx.db.insert("budgets", {
      householdId,
      categoryId: args.categoryId,
      amount: args.amount,
      currency: args.currency,
      month: args.month,
      year: args.year,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("budgets"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = getHouseholdId(user as Record<string, unknown>);

    const budget = await ctx.db.get(args.id);
    if (!budget || budget.householdId !== householdId) {
      throw new Error("Budget not found");
    }

    await ctx.db.patch(args.id, { amount: args.amount });
  },
});

export const remove = mutation({
  args: {
    id: v.id("budgets"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = getHouseholdId(user as Record<string, unknown>);

    const budget = await ctx.db.get(args.id);
    if (!budget || budget.householdId !== householdId) {
      throw new Error("Budget not found");
    }

    await ctx.db.delete(args.id);
  },
});
