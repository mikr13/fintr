import { useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { EyeIcon } from "~/components/icons/eye";
import { EyeOffIcon } from "~/components/icons/eye-off";
import { CheckIcon } from "~/components/icons/check";
import { XIcon } from "~/components/icons/x";
import { validatePassword } from "~/lib/validators";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/_auth/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isRegistering = useRef(false);

  if (isAuthenticated && !isRegistering.current) {
    void navigate({ to: "/" });
    return null;
  }

  const passwordValidation = validatePassword(password);
  const hasStartedTypingPassword = password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordValidation.valid) {
      setError("Please meet all password requirements.");
      return;
    }

    setIsLoading(true);
    isRegistering.current = true;

    try {
      await signIn("password", {
        email,
        password,
        flow: "signUp",
        name: `${firstName} ${lastName}`.trim(),
      });

      sessionStorage.setItem("fintr_pending_household", householdName || `${firstName}'s Household`);

      isRegistering.current = false;
      void navigate({ to: "/dashboard" });
    } catch {
      isRegistering.current = false;
      setError(
        "Could not create account. The email may already be registered."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Logo */}
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          fintr
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start tracking your household finances
        </p>
      </div>

      <Card className="border-border/50 bg-card/80 shadow-xl shadow-black/10 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Set up your profile and household
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  placeholder="Jane"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2",
                    "flex items-center justify-center rounded-sm p-0.5",
                    "text-muted-foreground transition-colors hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  )}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOffIcon size={18} />
                  ) : (
                    <EyeIcon size={18} />
                  )}
                </button>
              </div>

              {hasStartedTypingPassword && (
                <div className="mt-1 flex flex-col gap-1">
                  <PasswordCheck
                    met={passwordValidation.checks.minLength}
                    label="At least 8 characters"
                  />
                  <PasswordCheck
                    met={
                      passwordValidation.checks.hasUppercase &&
                      passwordValidation.checks.hasLowercase
                    }
                    label="Upper and lowercase letters"
                  />
                  <PasswordCheck
                    met={passwordValidation.checks.hasNumber}
                    label="A number (0-9)"
                  />
                  <PasswordCheck
                    met={passwordValidation.checks.hasSpecial}
                    label="A special character"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="householdName">Household name</Label>
              <Input
                id="householdName"
                placeholder="e.g. The Doe Family"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                You can invite other members later
              </p>
            </div>

            <Button
              type="submit"
              className="mt-2 w-full"
              disabled={isLoading || !passwordValidation.valid}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
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
                  Creating account...
                </span>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

function PasswordCheck({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <CheckIcon size={14} className="shrink-0 text-positive" />
      ) : (
        <XIcon size={14} className="shrink-0 text-muted-foreground" />
      )}
      <span
        className={cn(
          "transition-colors",
          met ? "text-positive" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
}
