import { useState, useRef, useCallback, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api.js";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { FingerprintIcon } from "~/components/icons/fingerprint";
import { cn } from "~/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel.js";

export const Route = createFileRoute("/_auth/verify-2fa")({
  component: Verify2FAPage,
});

function Verify2FAPage() {
  const navigate = useNavigate();
  const verifyToken = useAction(api.totp.verifyToken);
  const useRecoveryCode = useAction(api.totp.useRecoveryCode);

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      if (value.length > 1) {
        const pasted = value.replace(/\D/g, "").slice(0, 6);
        if (pasted.length > 1) {
          const newDigits = Array(6).fill("");
          for (let i = 0; i < pasted.length && i < 6; i++) {
            newDigits[i] = pasted[i];
          }
          setDigits(newDigits);
          const nextIndex = Math.min(pasted.length, 5);
          inputRefs.current[nextIndex]?.focus();
          return;
        }
      }

      const digit = value.replace(/\D/g, "").slice(-1);
      const newDigits = [...digits];
      newDigits[index] = digit;
      setDigits(newDigits);
      setError(null);

      if (digit && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits]
  );

  const handleVerify = useCallback(async () => {
    const token = digits.join("");
    if (token.length !== 6) {
      setError("Please enter the full 6-digit code");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const userId = searchParams.get("userId") as Id<"users"> | null;
      if (!userId) {
        setError("Invalid session. Please log in again.");
        return;
      }

      const valid = await verifyToken({ userId, token });
      if (valid) {
        void navigate({ to: "/" });
      } else {
        setError("Invalid code. Please try again.");
        setDigits(Array(6).fill(""));
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [digits, verifyToken, navigate]);

  const handleRecoverySubmit = useCallback(async () => {
    if (!recoveryCode.trim()) {
      setError("Please enter a recovery code");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const userId = searchParams.get("userId") as Id<"users"> | null;
      if (!userId) {
        setError("Invalid session. Please log in again.");
        return;
      }

      const valid = await useRecoveryCode({
        userId,
        code: recoveryCode.trim(),
      });
      if (valid) {
        void navigate({ to: "/" });
      } else {
        setError("Invalid recovery code. Please try again.");
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [recoveryCode, useRecoveryCode, navigate]);

  const code = digits.join("");

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          fintr
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Two-factor authentication
        </p>
      </div>

      <Card className="border-border/50 bg-card/80 shadow-xl shadow-black/10 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-4">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <FingerprintIcon size={24} className="text-primary" />
          </div>
          <CardTitle className="text-center text-xl">
            {showRecovery ? "Recovery code" : "Verification code"}
          </CardTitle>
          <CardDescription className="text-center">
            {showRecovery
              ? "Enter one of your recovery codes to access your account"
              : "Enter the 6-digit code from your authenticator app"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {showRecovery ? (
            <div className="flex flex-col gap-4">
              <Input
                type="text"
                placeholder="Enter recovery code"
                value={recoveryCode}
                onChange={(e) => {
                  setRecoveryCode(e.target.value);
                  setError(null);
                }}
                className="font-mono tracking-wider"
                autoFocus
              />
              <Button
                onClick={handleRecoverySubmit}
                disabled={isLoading || !recoveryCode.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner />
                    Verifying...
                  </span>
                ) : (
                  "Verify recovery code"
                )}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setShowRecovery(false);
                  setError(null);
                  setRecoveryCode("");
                }}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Use authenticator code instead
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex justify-center gap-2">
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={(e) => {
                      const text = e.clipboardData
                        .getData("text")
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      if (text.length > 1) {
                        e.preventDefault();
                        const newDigits = Array(6).fill("");
                        for (let j = 0; j < text.length && j < 6; j++) {
                          newDigits[j] = text[j];
                        }
                        setDigits(newDigits);
                        const nextIndex = Math.min(text.length, 5);
                        inputRefs.current[nextIndex]?.focus();
                      }
                    }}
                    className={cn(
                      "h-12 w-10 rounded-md border bg-background text-center font-mono text-lg",
                      "outline-none ring-offset-background transition-all",
                      "focus:border-primary focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      i === 2 && "mr-2",
                      digit
                        ? "border-primary/50 text-foreground"
                        : "border-input text-muted-foreground"
                    )}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              <Button
                onClick={handleVerify}
                disabled={isLoading || code.length !== 6}
                className="w-full"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner />
                    Verifying...
                  </span>
                ) : (
                  "Verify"
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setShowRecovery(true);
                  setError(null);
                  setDigits(Array(6).fill(""));
                }}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Use a recovery code instead
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
