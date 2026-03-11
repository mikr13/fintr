import { v } from "convex/values";
import { query, mutation } from "./_generated/server.js";
import { getAuthenticatedUser } from "./helpers.js";
import { getAuthUserId } from "@convex-dev/auth/server";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db.get(userId);
  },
});

export const updateProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const patch: { firstName?: string; lastName?: string } = {};
    if (args.firstName !== undefined) patch.firstName = args.firstName;
    if (args.lastName !== undefined) patch.lastName = args.lastName;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(user._id, patch);
    }
  },
});

export const updatePreferences = mutation({
  args: {
    currency: v.optional(v.string()),
    locale: v.optional(v.string()),
    dateFormat: v.optional(v.string()),
    theme: v.optional(v.string()),
    timezone: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const preferences: Record<string, string> = {};
    if (args.currency !== undefined) preferences.currency = args.currency;
    if (args.locale !== undefined) preferences.locale = args.locale;
    if (args.dateFormat !== undefined) preferences.dateFormat = args.dateFormat;
    if (args.theme !== undefined) preferences.theme = args.theme;
    if (args.timezone !== undefined) preferences.timezone = args.timezone;
    if (args.country !== undefined) preferences.country = args.country;

    if (Object.keys(preferences).length > 0) {
      await ctx.db.patch(user._id, {
        preferences,
      });
    }
  },
});
