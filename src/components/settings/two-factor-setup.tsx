import { api } from "convex/_generated/api.js";
import { useAction, useQuery } from "convex/react";
import { useCallback, useRef, useState } from "react";
import { ShieldCheckIcon } from "~/components/icons/shield-check";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";

type SetupStep = "idle" | "qr" | "verify" | "recovery" | "done";

export function TwoFactorSetup() {
  const user = useQuery(api.users.currentUser);
  const generateSecret = useAction(api.totp.generateSecret);
  const verifyAndEnable = useAction(api.totp.verifyAndEnable);
  const disableTotp = useAction(api.totp.disable);

  const totpEnabled = !!(user as Record<string, unknown> | null)?.totpEnabled;

  const [step, setStep] = useState<SetupStep>(totpEnabled ? "done" : "idle");
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [savedCodes, setSavedCodes] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  const handleStartSetup = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await generateSecret();
      setSecret(result.secret);
      setUri(result.uri);
      setStep("qr");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start setup");
    } finally {
      setIsLoading(false);
    }
  }, [generateSecret]);

  const handleVerify = useCallback(async () => {
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const result = await verifyAndEnable({ token: code });
      setRecoveryCodes(result.recoveryCodes);
      setStep("recovery");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  }, [code, verifyAndEnable]);

  const handleDisable = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      await disableTotp();
      setStep("idle");
      setSecret("");
      setUri("");
      setCode("");
      setRecoveryCodes([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable 2FA");
    } finally {
      setIsLoading(false);
    }
  }, [disableTotp]);

  const copySecret = useCallback(async () => {
    await navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  }, [secret]);

  const copyRecoveryCodes = useCallback(async () => {
    await navigator.clipboard.writeText(recoveryCodes.join("\n"));
  }, [recoveryCodes]);

  if (step === "done" || (totpEnabled && step === "idle")) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-positive/10">
              <ShieldCheckIcon size={20} className="text-positive" />
            </div>
            <div>
              <CardTitle className="text-base">
                Two-factor authentication is enabled
              </CardTitle>
              <CardDescription>
                Your account is protected with an authenticator app
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button
            variant="destructive"
            onClick={handleDisable}
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? "Disabling..." : "Disable 2FA"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "idle") {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <ShieldCheckIcon size={20} className="text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">
                Two-factor authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account using an
                authenticator app
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button
            onClick={handleStartSetup}
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? "Setting up..." : "Enable 2FA"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "qr") {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(uri)}&size=200x200&bgcolor=09090b&color=fafafa`;

    return (
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Scan QR code</CardTitle>
          <CardDescription>
            Use your authenticator app (Google Authenticator, Authy, etc.) to
            scan this QR code
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex justify-center">
            <div className="rounded-xl border border-border/50 bg-[#09090b] p-4">
              <img
                src={qrUrl}
                alt="2FA QR Code"
                width={200}
                height={200}
                className="rounded-md"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              Can&apos;t scan? Enter this key manually:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs tracking-wider break-all">
                {secret}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={copySecret}
                className="shrink-0"
              >
                {copiedSecret ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">
              Enter the 6-digit code from your authenticator app
            </p>
            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="flex items-center gap-3">
              <Input
                ref={codeInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setCode(val);
                }}
                className="max-w-[160px] font-mono text-center text-lg tracking-[0.3em]"
                autoFocus
              />
              <Button
                onClick={handleVerify}
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? "Verifying..." : "Verify & Enable"}
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => {
              setStep("idle");
              setError(null);
              setCode("");
            }}
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "recovery") {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Save your recovery codes</CardTitle>
          <CardDescription>
            Store these codes in a safe place. Each code can only be used once to
            access your account if you lose your authenticator device.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <div className="grid grid-cols-2 gap-2">
              {recoveryCodes.map((rc, i) => (
                <code
                  key={i}
                  className="rounded border border-border bg-background px-3 py-1.5 text-center font-mono text-sm tracking-wider"
                >
                  {rc}
                </code>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={copyRecoveryCodes}>
              Copy all codes
            </Button>
          </div>

          <Separator />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={savedCodes}
              onChange={(e) => setSavedCodes(e.target.checked)}
              className={cn(
                "h-4 w-4 rounded border-border bg-background",
                "accent-primary"
              )}
            />
            I&apos;ve saved these recovery codes in a safe place
          </label>

          <Button
            onClick={() => setStep("done")}
            disabled={!savedCodes}
          >
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
