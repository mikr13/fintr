import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server.js";
import { internal } from "./_generated/api.js";
import { auth } from "./auth.js";

const http = httpRouter();

auth.addHttpRoutes(http);

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-API-Key",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

function extractApiKey(request: Request): string | null {
  const xApiKey = request.headers.get("X-API-Key");
  if (xApiKey) return xApiKey;

  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

// ─── CORS Preflight ──────────────────────────────────────────────────────────

const corsPreflightHandler = httpAction(async () => {
  return new Response(null, { status: 204, headers: corsHeaders() });
});

http.route({
  path: "/api/token",
  method: "OPTIONS",
  handler: corsPreflightHandler,
});

http.route({
  path: "/api/transactions",
  method: "OPTIONS",
  handler: corsPreflightHandler,
});

// ─── POST /api/token ─────────────────────────────────────────────────────────

http.route({
  path: "/api/token",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const rawKey = extractApiKey(request);
    if (!rawKey) {
      return jsonResponse({ error: "Missing API key" }, 401);
    }

    try {
      const hashedKey = await hashString(rawKey);
      const keyRecord = await ctx.runQuery(internal.apiKeys.lookupApiKey, {
        hashedKey,
      });

      if (!keyRecord) {
        return jsonResponse({ error: "Invalid API key" }, 401);
      }

      const result = await ctx.runMutation(internal.apiKeys.generateToken, {
        userId: keyRecord.userId,
        householdId: keyRecord.householdId,
        apiKeyId: keyRecord.keyId,
        source: request.headers.get("User-Agent") ?? "unknown",
      });

      await ctx.runMutation(internal.apiKeys.logApiAccess, {
        userId: keyRecord.userId,
        action: "token_generated",
        endpoint: "/api/token",
        success: true,
      });

      return jsonResponse(
        { token: result.token, expiresAt: result.expiresAt },
        201,
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "Internal error";
      if (message.includes("Rate limit")) {
        return jsonResponse({ error: message }, 429);
      }
      return jsonResponse({ error: message }, 500);
    }
  }),
});

// ─── POST /api/transactions ──────────────────────────────────────────────────

http.route({
  path: "/api/transactions",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const rawToken = extractBearerToken(request);
    if (!rawToken) {
      return jsonResponse({ error: "Missing bearer token" }, 401);
    }

    let hashedToken: string;
    try {
      hashedToken = await hashString(rawToken);
    } catch {
      return jsonResponse({ error: "Invalid token format" }, 401);
    }

    const tokenRecord = await ctx.runQuery(internal.apiKeys.validateToken, {
      hashedToken,
    });

    if (!tokenRecord) {
      return jsonResponse(
        { error: "Invalid, expired, or revoked token" },
        401,
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const { description, amount, type, accountId, accountName, categoryId, date, notes } = body;

    if (!description || typeof description !== "string") {
      return jsonResponse({ error: "description is required (string)" }, 400);
    }
    if (amount === undefined || typeof amount !== "number" || amount <= 0) {
      return jsonResponse(
        { error: "amount is required (positive number)" },
        400,
      );
    }
    if (!type || !["income", "expense", "transfer"].includes(type as string)) {
      return jsonResponse(
        { error: 'type must be "income", "expense", or "transfer"' },
        400,
      );
    }

    try {
      let resolvedAccountId = accountId as string | undefined;

      if (!resolvedAccountId && accountName && typeof accountName === "string") {
        const account = await ctx.runQuery(
          internal.apiKeys.lookupAccountByName,
          { householdId: tokenRecord.householdId, name: accountName },
        );
        if (!account) {
          return jsonResponse(
            { error: `Account not found: ${accountName}` },
            400,
          );
        }
        resolvedAccountId = account._id;
      }

      if (!resolvedAccountId) {
        return jsonResponse(
          { error: "accountId or accountName is required" },
          400,
        );
      }

      const household = await ctx.runQuery(
        internal.apiKeys.getHouseholdCurrency,
        { householdId: tokenRecord.householdId },
      );

      const txDate =
        date && typeof date === "string"
          ? date
          : new Date().toISOString().split("T")[0]!;

      const transactionId = await ctx.runMutation(
        internal.apiKeys.createTransactionInternal,
        {
          householdId: tokenRecord.householdId,
          accountId: resolvedAccountId as never,
          type: type as string,
          amount: amount as number,
          currency: household?.currency ?? "USD",
          description: description as string,
          categoryId: categoryId as never,
          date: txDate,
          notes: notes as string | undefined,
          createdBy: tokenRecord.userId,
          source: "api",
        },
      );

      await ctx.runMutation(internal.apiKeys.touchTokenLastUsed, {
        tokenId: tokenRecord._id,
      });

      await ctx.runMutation(internal.apiKeys.logApiAccess, {
        userId: tokenRecord.userId,
        tokenId: tokenRecord._id,
        action: "transaction_created",
        endpoint: "/api/transactions",
        success: true,
        metadata: JSON.stringify({
          transactionId,
          type,
          amount,
        }),
      });

      return jsonResponse(
        { transactionId, status: "created" },
        201,
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "Internal error";

      await ctx.runMutation(internal.apiKeys.logApiAccess, {
        userId: tokenRecord.userId,
        tokenId: tokenRecord._id,
        action: "transaction_failed",
        endpoint: "/api/transactions",
        success: false,
        metadata: message,
      });

      return jsonResponse({ error: message }, 500);
    }
  }),
});

export default http;
