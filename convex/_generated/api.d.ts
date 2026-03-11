/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as apiKeys from "../apiKeys.js";
import type * as auth from "../auth.js";
import type * as budgets from "../budgets.js";
import type * as categories from "../categories.js";
import type * as crons from "../crons.js";
import type * as helpers from "../helpers.js";
import type * as households from "../households.js";
import type * as http from "../http.js";
import type * as merchants from "../merchants.js";
import type * as tags from "../tags.js";
import type * as totp from "../totp.js";
import type * as totpMutations from "../totpMutations.js";
import type * as transactionRules from "../transactionRules.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  apiKeys: typeof apiKeys;
  auth: typeof auth;
  budgets: typeof budgets;
  categories: typeof categories;
  crons: typeof crons;
  helpers: typeof helpers;
  households: typeof households;
  http: typeof http;
  merchants: typeof merchants;
  tags: typeof tags;
  totp: typeof totp;
  totpMutations: typeof totpMutations;
  transactionRules: typeof transactionRules;
  transactions: typeof transactions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
