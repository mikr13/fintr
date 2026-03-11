import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  users: defineTable({
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.float64()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.float64()),
    householdId: v.optional(v.id("households")),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    preferences: v.optional(
      v.object({
        currency: v.optional(v.string()),
        locale: v.optional(v.string()),
        dateFormat: v.optional(v.string()),
        theme: v.optional(v.string()),
        timezone: v.optional(v.string()),
        country: v.optional(v.string()),
      }),
    ),
    totpEnabled: v.optional(v.boolean()),
    totpSecret: v.optional(v.string()),
    pendingTotpSecret: v.optional(v.string()),
    recoveryCodes: v.optional(v.array(v.string())),
  }).index("by_email", ["email"]),

  households: defineTable({
    name: v.string(),
    currency: v.string(),
    country: v.string(),
    createdBy: v.id("users"),
  }),

  householdMembers: defineTable({
    householdId: v.id("households"),
    userId: v.id("users"),
    role: v.string(),
  })
    .index("by_household", ["householdId"])
    .index("by_user", ["userId"]),

  accounts: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    type: v.string(),
    subtype: v.optional(v.string()),
    balance: v.number(),
    currency: v.string(),
    isDebt: v.boolean(),
    createdBy: v.id("users"),
  })
    .index("by_household", ["householdId"])
    .index("by_household_type", ["householdId", "type"]),

  accountBalanceHistory: defineTable({
    accountId: v.id("accounts"),
    balance: v.number(),
    date: v.string(),
  })
    .index("by_account", ["accountId"])
    .index("by_account_date", ["accountId", "date"]),

  transactions: defineTable({
    householdId: v.id("households"),
    accountId: v.id("accounts"),
    type: v.string(),
    amount: v.number(),
    currency: v.string(),
    description: v.string(),
    categoryId: v.optional(v.id("categories")),
    merchantId: v.optional(v.id("merchants")),
    date: v.string(),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.id("tags"))),
    transferToAccountId: v.optional(v.id("accounts")),
    createdBy: v.id("users"),
    source: v.optional(v.string()),
  })
    .index("by_household", ["householdId"])
    .index("by_household_date", ["householdId", "date"])
    .index("by_household_type", ["householdId", "type"])
    .index("by_account", ["accountId"]),

  categories: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    type: v.string(),
    isDefault: v.boolean(),
  }).index("by_household", ["householdId"]),

  budgets: defineTable({
    householdId: v.id("households"),
    categoryId: v.id("categories"),
    amount: v.number(),
    currency: v.string(),
    month: v.number(),
    year: v.number(),
  })
    .index("by_household", ["householdId"])
    .index("by_household_period", ["householdId", "year", "month"]),

  tags: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    color: v.optional(v.string()),
  }).index("by_household", ["householdId"]),

  merchants: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    icon: v.optional(v.string()),
  }).index("by_household", ["householdId"]),

  transactionRules: defineTable({
    householdId: v.id("households"),
    name: v.string(),
    conditions: v.any(),
    actions: v.any(),
    enabled: v.boolean(),
  }).index("by_household", ["householdId"]),

  invites: defineTable({
    householdId: v.id("households"),
    code: v.string(),
    expiresAt: v.number(),
    usedBy: v.optional(v.id("users")),
    createdBy: v.id("users"),
  }).index("by_code", ["code"]),

  apiKeys: defineTable({
    userId: v.id("users"),
    hashedKey: v.string(),
    prefix: v.string(),
    createdAt: v.number(),
    label: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_prefix", ["prefix"])
    .index("by_hashed_key", ["hashedKey"]),

  apiTokens: defineTable({
    hashedToken: v.string(),
    userId: v.id("users"),
    householdId: v.id("households"),
    apiKeyId: v.id("apiKeys"),
    expiresAt: v.number(),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
    source: v.string(),
    revoked: v.boolean(),
  })
    .index("by_token", ["hashedToken"])
    .index("by_user", ["userId"])
    .index("by_expiry", ["expiresAt"]),

  apiAuditLog: defineTable({
    userId: v.id("users"),
    tokenId: v.optional(v.id("apiTokens")),
    action: v.string(),
    endpoint: v.string(),
    timestamp: v.number(),
    success: v.boolean(),
    metadata: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_user_timestamp", ["userId", "timestamp"]),
});
