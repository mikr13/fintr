import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
} from "./_generated/server.js";

export const storePendingSecret = internalMutation({
  args: {
    email: v.string(),
    pendingTotpSecret: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      pendingTotpSecret: args.pendingTotpSecret,
    });
  },
});

export const getUser = internalQuery({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getUserById = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const enableTotp = internalMutation({
  args: {
    email: v.string(),
    totpSecret: v.string(),
    hashedRecoveryCodes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      totpSecret: args.totpSecret,
      totpEnabled: true,
      recoveryCodes: args.hashedRecoveryCodes,
      pendingTotpSecret: undefined,
    });
  },
});

export const disableTotp = internalMutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      totpEnabled: false,
      totpSecret: undefined,
      recoveryCodes: undefined,
      pendingTotpSecret: undefined,
    });
  },
});

export const updateRecoveryCodes = internalMutation({
  args: {
    userId: v.id("users"),
    recoveryCodes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      recoveryCodes: args.recoveryCodes,
    });
  },
});
