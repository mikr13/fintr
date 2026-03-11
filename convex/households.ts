import { v } from "convex/values";
import { query, mutation } from "./_generated/server.js";
import { getAuthenticatedUser, requireHouseholdAdmin } from "./helpers.js";

// ─── Mutations ──────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    name: v.string(),
    currency: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const householdId = await ctx.db.insert("households", {
      name: args.name,
      currency: args.currency ?? "USD",
      country: args.country ?? "US",
      createdBy: user._id,
    });

    await ctx.db.insert("householdMembers", {
      householdId,
      userId: user._id,
      role: "admin",
    });

    await ctx.db.patch(user._id, { householdId });

    return householdId;
  },
});

export const update = mutation({
  args: {
    name: v.optional(v.string()),
    currency: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const { householdId } = await requireHouseholdAdmin(ctx, user._id);

    const patch: Record<string, string> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.currency !== undefined) patch.currency = args.currency;
    if (args.country !== undefined) patch.country = args.country;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(householdId, patch);
    }
  },
});

export const createInvite = mutation({
  args: {
    label: v.optional(v.string()),
  },
  handler: async (ctx, _args) => {
    const user = await getAuthenticatedUser(ctx);
    await requireHouseholdAdmin(ctx, user._id);

    const householdId = user.householdId!;

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    await ctx.db.insert("invites", {
      householdId,
      code,
      expiresAt,
      createdBy: user._id,
    });

    return { code, expiresAt };
  },
});

export const useInvite = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (!invite) throw new Error("Invalid invite code");
    if (invite.expiresAt < Date.now()) throw new Error("Invite code expired");
    if (invite.usedBy) throw new Error("Invite code already used");

    const user = await getAuthenticatedUser(ctx);

    const existingMembership = await ctx.db
      .query("householdMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (existingMembership) throw new Error("Already a member of a household");

    await ctx.db.insert("householdMembers", {
      householdId: invite.householdId,
      userId: user._id,
      role: "member",
    });

    await ctx.db.patch(user._id, {
      householdId: invite.householdId,
    });

    await ctx.db.patch(invite._id, { usedBy: user._id });

    return invite.householdId;
  },
});

export const removeMember = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    await requireHouseholdAdmin(ctx, caller._id);

    if (args.userId === caller._id) {
      throw new Error("Cannot remove yourself");
    }

    const callerHouseholdId = caller.householdId!;

    const membership = await ctx.db
      .query("householdMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (!membership || membership.householdId !== callerHouseholdId) {
      throw new Error("User is not a member of this household");
    }

    await ctx.db.delete(membership._id);
    await ctx.db.patch(args.userId, {
      householdId: undefined,
    });
  },
});

export const updateMemberRole = mutation({
  args: {
    memberId: v.id("householdMembers"),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const caller = await getAuthenticatedUser(ctx);
    await requireHouseholdAdmin(ctx, caller._id);

    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");

    const callerHouseholdId = caller.householdId!;
    if (member.householdId !== callerHouseholdId) {
      throw new Error("Member does not belong to your household");
    }

    await ctx.db.patch(args.memberId, { role: args.role });
  },
});

// ─── Queries ────────────────────────────────────────────────────────────────

export const get = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = user.householdId;
    if (!householdId) return null;

    return await ctx.db.get(householdId);
  },
});

export const getMembers = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    const householdId = user.householdId;
    if (!householdId) return [];

    const members = await ctx.db
      .query("householdMembers")
      .withIndex("by_household", (q) => q.eq("householdId", householdId))
      .collect();

    const result = await Promise.all(
      members.map(async (member) => {
        const memberUser = await ctx.db.get(member.userId);
        return {
          memberId: member._id,
          userId: member.userId,
          name: memberUser?.name,
          email: memberUser?.email,
          role: member.role,
        };
      }),
    );

    return result;
  },
});
