import { v } from "convex/values";
import {
  query,
  mutation,
  internalMutation,
  internalQuery,
} from "./_generated/server.js";
import type { Id } from "./_generated/dataModel.js";
import { getAuthenticatedUser } from "./helpers.js";

async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function toBase64Url(bytes: Uint8Array): string {
  const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join("");
  return btoa(binString)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ─── API Key Management ──────────────────────────────────────────────────────

export const getApiKey = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!key) return null;
    return { _id: key._id, prefix: key.prefix, createdAt: key.createdAt, label: key.label };
  },
});

export const generateApiKey = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const existing = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (existing) {
      const tokens = await ctx.db
        .query("apiTokens")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
      for (const token of tokens) {
        if (!token.revoked) {
          await ctx.db.patch(token._id, { revoked: true });
        }
      }
      await ctx.db.delete(existing._id);
    }

    const rawBytes = crypto.getRandomValues(new Uint8Array(32));
    const rawKey = "fntr_" + toBase64Url(rawBytes);
    const hashedKey = await hashString(rawKey);

    const keyId = await ctx.db.insert("apiKeys", {
      userId: user._id,
      hashedKey,
      prefix: rawKey.substring(0, 13),
      createdAt: Date.now(),
      label: "Default",
    });

    return { key: rawKey, prefix: rawKey.substring(0, 13), _id: keyId };
  },
});

export const revokeApiKey = mutation({
  args: { keyId: v.id("apiKeys") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const key = await ctx.db.get(args.keyId);
    if (!key || key.userId !== user._id) throw new Error("API key not found");

    const tokens = await ctx.db
      .query("apiTokens")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const token of tokens) {
      if (!token.revoked && token.apiKeyId === args.keyId) {
        await ctx.db.patch(token._id, { revoked: true });
      }
    }

    await ctx.db.delete(args.keyId);
  },
});

// ─── Token Management ────────────────────────────────────────────────────────

export const generateToken = internalMutation({
  args: {
    userId: v.id("users"),
    householdId: v.id("households"),
    apiKeyId: v.id("apiKeys"),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const activeTokens = await ctx.db
      .query("apiTokens")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const active = activeTokens.filter(
      (t) => !t.revoked && t.expiresAt > Date.now(),
    );
    if (active.length >= 5) {
      throw new Error("Rate limit: too many active tokens (max 5)");
    }

    const rawBytes = crypto.getRandomValues(new Uint8Array(64));
    const rawToken = toBase64Url(rawBytes);
    const hashedToken = await hashString(rawToken);

    const expiresAt = Date.now() + 6 * 60 * 60 * 1000;

    await ctx.db.insert("apiTokens", {
      hashedToken,
      userId: args.userId,
      householdId: args.householdId,
      apiKeyId: args.apiKeyId,
      expiresAt,
      createdAt: Date.now(),
      source: args.source,
      revoked: false,
    });

    return { token: rawToken, expiresAt };
  },
});

export const validateToken = internalQuery({
  args: { hashedToken: v.string() },
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("apiTokens")
      .withIndex("by_token", (q) => q.eq("hashedToken", args.hashedToken))
      .first();

    if (!tokenRecord) return null;
    if (tokenRecord.revoked) return null;
    if (tokenRecord.expiresAt < Date.now()) return null;

    return tokenRecord;
  },
});

export const touchTokenLastUsed = internalMutation({
  args: { tokenId: v.id("apiTokens") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tokenId, { lastUsedAt: Date.now() });
  },
});

export const listActiveTokens = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    const tokens = await ctx.db
      .query("apiTokens")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return tokens
      .filter((t) => !t.revoked && t.expiresAt > Date.now())
      .map((t) => ({
        _id: t._id,
        source: t.source,
        createdAt: t.createdAt,
        lastUsedAt: t.lastUsedAt,
        expiresAt: t.expiresAt,
      }));
  },
});

export const revokeToken = mutation({
  args: { tokenId: v.id("apiTokens") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const token = await ctx.db.get(args.tokenId);
    if (!token || token.userId !== user._id) throw new Error("Token not found");
    await ctx.db.patch(args.tokenId, { revoked: true });
  },
});

export const revokeAllTokens = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    const tokens = await ctx.db
      .query("apiTokens")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const token of tokens) {
      if (!token.revoked) {
        await ctx.db.patch(token._id, { revoked: true });
      }
    }
  },
});

export const cleanupExpiredTokens = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allTokens = await ctx.db.query("apiTokens").collect();
    const now = Date.now();
    let cleaned = 0;
    for (const token of allTokens) {
      if (token.expiresAt < now || token.revoked) {
        await ctx.db.delete(token._id);
        cleaned++;
      }
    }
    return { cleaned };
  },
});

// ─── Audit Logging ───────────────────────────────────────────────────────────

export const logApiAccess = internalMutation({
  args: {
    userId: v.id("users"),
    tokenId: v.optional(v.id("apiTokens")),
    action: v.string(),
    endpoint: v.string(),
    success: v.boolean(),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("apiAuditLog", {
      userId: args.userId,
      tokenId: args.tokenId,
      action: args.action,
      endpoint: args.endpoint,
      timestamp: Date.now(),
      success: args.success,
      metadata: args.metadata,
    });
  },
});

export const getAuditLog = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    const entries = await ctx.db
      .query("apiAuditLog")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
    return entries;
  },
});

// ─── Internal helpers for HTTP actions ───────────────────────────────────────

export const lookupApiKey = internalQuery({
  args: { hashedKey: v.string() },
  handler: async (ctx, args) => {
    const allKeys = await ctx.db.query("apiKeys").collect();
    const key = allKeys.find((k) => k.hashedKey === args.hashedKey);
    if (!key) return null;

    const user = await ctx.db.get(key.userId);
    if (!user) return null;

    const householdId = (user as Record<string, unknown>)
      .householdId as Id<"households"> | undefined;
    if (!householdId) return null;

    return { keyId: key._id, userId: key.userId, householdId };
  },
});

export const getHouseholdCurrency = internalQuery({
  args: { householdId: v.id("households") },
  handler: async (ctx, args) => {
    const household = await ctx.db.get(args.householdId);
    if (!household) return null;
    return { currency: household.currency };
  },
});

export const lookupAccountByName = internalQuery({
  args: { householdId: v.id("households"), name: v.string() },
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_household", (q) => q.eq("householdId", args.householdId))
      .collect();
    const match = accounts.find(
      (a) => a.name.toLowerCase() === args.name.toLowerCase(),
    );
    return match ?? null;
  },
});

export const createTransactionInternal = internalMutation({
  args: {
    householdId: v.id("households"),
    accountId: v.id("accounts"),
    type: v.string(),
    amount: v.number(),
    currency: v.string(),
    description: v.string(),
    categoryId: v.optional(v.id("categories")),
    date: v.string(),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    if (!account || account.householdId !== args.householdId) {
      throw new Error("Account not found in household");
    }

    const txId = await ctx.db.insert("transactions", {
      householdId: args.householdId,
      accountId: args.accountId,
      type: args.type,
      amount: args.amount,
      currency: args.currency,
      description: args.description,
      categoryId: args.categoryId,
      date: args.date,
      notes: args.notes,
      createdBy: args.createdBy,
      source: args.source,
    });

    const balanceDelta =
      args.type === "income"
        ? args.amount
        : args.type === "expense"
          ? -args.amount
          : -args.amount;

    await ctx.db.patch(args.accountId, {
      balance: account.balance + balanceDelta,
    });

    await ctx.db.insert("accountBalanceHistory", {
      accountId: args.accountId,
      balance: account.balance + balanceDelta,
      date: args.date,
    });

    return txId;
  },
});
