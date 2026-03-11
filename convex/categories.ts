import { v } from "convex/values";
import { query, mutation } from "./_generated/server.js";
import type { Id } from "./_generated/dataModel.js";
import { getAuthenticatedUser } from "./helpers.js";

const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", icon: "UtensilsCrossed", color: "#ef4444", type: "expense" },
  { name: "Transportation", icon: "Car", color: "#f97316", type: "expense" },
  { name: "Housing", icon: "Home", color: "#eab308", type: "expense" },
  { name: "Entertainment", icon: "Film", color: "#84cc16", type: "expense" },
  { name: "Shopping", icon: "ShoppingBag", color: "#22c55e", type: "expense" },
  { name: "Utilities", icon: "Zap", color: "#14b8a6", type: "expense" },
  { name: "Healthcare", icon: "Heart", color: "#06b6d4", type: "expense" },
  { name: "Education", icon: "GraduationCap", color: "#3b82f6", type: "expense" },
  { name: "Travel", icon: "Plane", color: "#6366f1", type: "expense" },
  { name: "Personal Care", icon: "Sparkles", color: "#8b5cf6", type: "expense" },
  { name: "Subscriptions", icon: "RefreshCw", color: "#a855f7", type: "expense" },
  { name: "Gifts", icon: "Gift", color: "#d946ef", type: "expense" },
  { name: "Insurance", icon: "Shield", color: "#ec4899", type: "expense" },
  { name: "Salary", icon: "Banknote", color: "#10b981", type: "income" },
  { name: "Freelance", icon: "Laptop", color: "#14b8a6", type: "income" },
  { name: "Investments", icon: "TrendingUp", color: "#06b6d4", type: "income" },
  { name: "Rental Income", icon: "Building", color: "#3b82f6", type: "income" },
  { name: "Other Income", icon: "CircleDollarSign", color: "#6366f1", type: "income" },
] as const;

function getHouseholdId(user: Record<string, unknown>): Id<"households"> {
  const householdId = user.householdId as Id<"households"> | undefined;
  if (!householdId) throw new Error("No household");
  return householdId;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = (user as Record<string, unknown>)
      .householdId as Id<"households"> | undefined;
    if (!householdId) return [];

    return await ctx.db
      .query("categories")
      .withIndex("by_household", (q) => q.eq("householdId", householdId))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    type: v.string(),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = getHouseholdId(user as Record<string, unknown>);

    return await ctx.db.insert("categories", {
      householdId,
      name: args.name,
      icon: args.icon,
      color: args.color,
      type: args.type,
      isDefault: args.isDefault ?? false,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = getHouseholdId(user as Record<string, unknown>);

    const category = await ctx.db.get(args.id);
    if (!category || category.householdId !== householdId) {
      throw new Error("Category not found");
    }

    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.icon !== undefined) patch.icon = args.icon;
    if (args.color !== undefined) patch.color = args.color;
    if (args.type !== undefined) patch.type = args.type;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.id, patch);
    }
  },
});

export const remove = mutation({
  args: {
    id: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = getHouseholdId(user as Record<string, unknown>);

    const category = await ctx.db.get(args.id);
    if (!category || category.householdId !== householdId) {
      throw new Error("Category not found");
    }

    const budgetUsingCategory = await ctx.db
      .query("budgets")
      .withIndex("by_household", (q) => q.eq("householdId", householdId))
      .filter((q) => q.eq(q.field("categoryId"), args.id))
      .first();

    if (budgetUsingCategory) {
      throw new Error("Cannot delete category that is used by a budget. Remove the budget first.");
    }

    await ctx.db.delete(args.id);
  },
});

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = getHouseholdId(user as Record<string, unknown>);

    const existing = await ctx.db
      .query("categories")
      .withIndex("by_household", (q) => q.eq("householdId", householdId))
      .first();

    if (existing) {
      throw new Error("Categories already exist for this household");
    }

    for (const cat of DEFAULT_CATEGORIES) {
      await ctx.db.insert("categories", {
        householdId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: cat.type,
        isDefault: true,
      });
    }
  },
});
