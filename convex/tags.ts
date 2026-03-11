import { v } from "convex/values";
import { query, mutation } from "./_generated/server.js";
import type { Id } from "./_generated/dataModel.js";
import { getAuthenticatedUser } from "./helpers.js";

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
      .query("tags")
      .withIndex("by_household", (q) => q.eq("householdId", householdId))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = getHouseholdId(user as Record<string, unknown>);

    return await ctx.db.insert("tags", {
      householdId,
      name: args.name,
      color: args.color,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tags"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = getHouseholdId(user as Record<string, unknown>);

    const tag = await ctx.db.get(args.id);
    if (!tag || tag.householdId !== householdId) {
      throw new Error("Tag not found");
    }

    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.color !== undefined) patch.color = args.color;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.id, patch);
    }
  },
});

export const remove = mutation({
  args: {
    id: v.id("tags"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = getHouseholdId(user as Record<string, unknown>);

    const tag = await ctx.db.get(args.id);
    if (!tag || tag.householdId !== householdId) {
      throw new Error("Tag not found");
    }

    await ctx.db.delete(args.id);
  },
});
