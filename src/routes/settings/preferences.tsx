import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api.js";
import { useCurrentUser } from "~/hooks/use-current-user";
import { useTheme } from "~/hooks/use-theme";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { CURRENCIES, DATE_FORMATS, PERIOD_OPTIONS } from "~/lib/constants";
import { cn } from "~/lib/utils";
import { Sun, Moon, Monitor } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/preferences")({
  component: PreferencesPage,
});

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (US)" },
  { value: "America/Chicago", label: "Central (US)" },
  { value: "America/Denver", label: "Mountain (US)" },
  { value: "America/Los_Angeles", label: "Pacific (US)" },
  { value: "America/Toronto", label: "Toronto" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Shanghai", label: "Shanghai" },
  { value: "Asia/Kolkata", label: "Kolkata" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "Pacific/Auckland", label: "Auckland" },
];

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "AU", name: "Australia" },
  { code: "JP", name: "Japan" },
  { code: "IN", name: "India" },
  { code: "SG", name: "Singapore" },
  { code: "NZ", name: "New Zealand" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "AE", name: "UAE" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
];

const THEME_OPTIONS = [
  { value: "light" as const, label: "Light", icon: Sun },
  { value: "dark" as const, label: "Dark", icon: Moon },
  { value: "system" as const, label: "System", icon: Monitor },
];

function PreferencesPage() {
  const { user } = useCurrentUser();
  const { theme, setTheme } = useTheme();
  const updatePreferences = useMutation(api.users.updatePreferences);

  const prefs = (user as Record<string, unknown>)?.preferences as Record<string, string> | undefined;

  const handlePrefChange = async (key: string, value: string) => {
    try {
      await updatePreferences({ [key]: value });
      toast.success("Preference updated");
    } catch {
      toast.error("Failed to update preference");
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Preferences
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize your experience
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Regional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={prefs?.currency ?? "USD"}
                onValueChange={(v) => handlePrefChange("currency", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <Select
                value={prefs?.country ?? "US"}
                onValueChange={(v) => handlePrefChange("country", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={prefs?.timezone ?? "America/New_York"}
                onValueChange={(v) => handlePrefChange("timezone", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date format</Label>
              <Select
                value={prefs?.dateFormat ?? "MM/dd/yyyy"}
                onValueChange={(v) => handlePrefChange("dateFormat", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Default period</Label>
            <Select
              value={prefs?.locale ?? "30"}
              onValueChange={(v) => handlePrefChange("locale", v)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={String(p.value)}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map((opt) => {
              const isActive = theme === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    "relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30 hover:bg-accent/50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon size={20} />
                  </div>
                  <span className={cn("text-sm font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
                    {opt.label}
                  </span>
                  {isActive && (
                    <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
