import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "./_generated/server.js";
import type { Id } from "./_generated/dataModel.js";

export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found");
  return user;
}

export async function requireHouseholdAdmin(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
) {
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found");

  const householdId = user.householdId;
  if (!householdId) throw new Error("No household");

  const member = await ctx.db
    .query("householdMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  if (!member || member.role !== "admin") throw new Error("Not authorized");

  return { user, householdId };
}
