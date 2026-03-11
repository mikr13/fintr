import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
} from "./_generated/server.js";

export const storePendingSecret = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    pendingTotpSecret: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    const user = users.find((u) => {
      const record = u as Record<string, unknown>;
      return (
        record.tokenIdentifier === args.tokenIdentifier ||
        record.email === args.tokenIdentifier
      );
    });
    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      pendingTotpSecret: args.pendingTotpSecret,
    } as Record<string, unknown>);
  },
});

export const getUser = internalQuery({
  args: {
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    return (
      users.find((u) => {
        const record = u as Record<string, unknown>;
        return (
          record.tokenIdentifier === args.tokenIdentifier ||
          record.email === args.tokenIdentifier
        );
      }) ?? null
    );
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
    tokenIdentifier: v.string(),
    totpSecret: v.string(),
    hashedRecoveryCodes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    const user = users.find((u) => {
      const record = u as Record<string, unknown>;
      return (
        record.tokenIdentifier === args.tokenIdentifier ||
        record.email === args.tokenIdentifier
      );
    });
    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      totpSecret: args.totpSecret,
      totpEnabled: true,
      recoveryCodes: args.hashedRecoveryCodes,
      pendingTotpSecret: undefined,
    } as Record<string, unknown>);
  },
});

export const disableTotp = internalMutation({
  args: {
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    const user = users.find((u) => {
      const record = u as Record<string, unknown>;
      return (
        record.tokenIdentifier === args.tokenIdentifier ||
        record.email === args.tokenIdentifier
      );
    });
    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      totpEnabled: false,
      totpSecret: undefined,
      recoveryCodes: undefined,
      pendingTotpSecret: undefined,
    } as Record<string, unknown>);
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
    } as Record<string, unknown>);
  },
});
