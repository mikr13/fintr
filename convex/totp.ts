"use node";

import { v } from "convex/values";
import * as OTPAuth from "otpauth";
import { action } from "./_generated/server.js";
import { internal } from "./_generated/api.js";

function createTotpInstance(secret: string, label: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: "Fintr",
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

function generateRecoveryCodes(): string[] {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    let code = "";
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    for (let j = 0; j < 8; j++) {
      code += chars[bytes[j] % chars.length];
    }
    codes.push(code);
  }
  return codes;
}

async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code.toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const generateSecret = action({
  args: {},
  handler: async (ctx): Promise<{ secret: string; uri: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const secret = new OTPAuth.Secret({ size: 20 });
    const email = identity.email ?? identity.subject;

    const totp = new OTPAuth.TOTP({
      issuer: "Fintr",
      label: email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret,
    });

    const base32Secret = secret.base32;
    const uri = totp.toString();

    await ctx.runMutation(internal.totpMutations.storePendingSecret, {
      tokenIdentifier: identity.tokenIdentifier ?? identity.subject,
      pendingTotpSecret: base32Secret,
    });

    return { secret: base32Secret, uri };
  },
});

export const verifyAndEnable = action({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args): Promise<{ recoveryCodes: string[] }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.runQuery(internal.totpMutations.getUser, {
      tokenIdentifier: identity.tokenIdentifier ?? identity.subject,
    });
    if (!user) throw new Error("User not found");

    const pendingSecret = (user as Record<string, unknown>)
      .pendingTotpSecret as string | undefined;
    if (!pendingSecret) {
      throw new Error("No pending 2FA setup. Please start the setup again.");
    }

    const email = identity.email ?? identity.subject;
    const totp = createTotpInstance(pendingSecret, email);
    const delta = totp.validate({ token: args.token, window: 1 });

    if (delta === null) {
      throw new Error("Invalid verification code. Please try again.");
    }

    const recoveryCodes = generateRecoveryCodes();
    const hashedCodes = await Promise.all(recoveryCodes.map(hashCode));

    await ctx.runMutation(internal.totpMutations.enableTotp, {
      tokenIdentifier: identity.tokenIdentifier ?? identity.subject,
      totpSecret: pendingSecret,
      hashedRecoveryCodes: hashedCodes,
    });

    return { recoveryCodes };
  },
});

export const verifyToken = action({
  args: {
    userId: v.id("users"),
    token: v.string(),
  },
  handler: async (ctx, args): Promise<boolean> => {
    const user = await ctx.runQuery(internal.totpMutations.getUserById, {
      userId: args.userId,
    });
    if (!user) return false;

    const totpSecret = (user as Record<string, unknown>).totpSecret as
      | string
      | undefined;
    if (!totpSecret) return false;

    const email = (user as Record<string, unknown>).email as string | undefined;
    const totp = createTotpInstance(totpSecret, email ?? "user");
    const delta = totp.validate({ token: args.token, window: 1 });

    return delta !== null;
  },
});

export const disable = action({
  args: {},
  handler: async (ctx): Promise<void> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.runMutation(internal.totpMutations.disableTotp, {
      tokenIdentifier: identity.tokenIdentifier ?? identity.subject,
    });
  },
});

export const useRecoveryCode = action({
  args: {
    userId: v.id("users"),
    code: v.string(),
  },
  handler: async (ctx, args): Promise<boolean> => {
    const user = await ctx.runQuery(internal.totpMutations.getUserById, {
      userId: args.userId,
    });
    if (!user) return false;

    const storedCodes = (user as Record<string, unknown>).recoveryCodes as
      | string[]
      | undefined;
    if (!storedCodes || storedCodes.length === 0) return false;

    const hashed = await hashCode(args.code);
    const index = storedCodes.indexOf(hashed);
    if (index === -1) return false;

    const updatedCodes = [...storedCodes];
    updatedCodes.splice(index, 1);

    await ctx.runMutation(internal.totpMutations.updateRecoveryCodes, {
      userId: args.userId,
      recoveryCodes: updatedCodes,
    });

    return true;
  },
});
