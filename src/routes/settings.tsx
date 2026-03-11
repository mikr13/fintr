import {
  createFileRoute,
  Link,
  Outlet,
  useMatchRoute,
  useNavigate,
} from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect } from "react";
import {
  User,
  SlidersHorizontal,
  Shield,
  Key,
  Tag,
  Store,
  Workflow,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { ChartPieIcon } from "~/components/icons/chart-pie";
import { cn } from "~/lib/utils";

export const Route = createFileRoute("/settings")({
  component: SettingsLayout,
});

const NAV_SECTIONS = [
  {
    label: "GENERAL",
    items: [
      { to: "/settings/profile", label: "Profile", icon: User },
      { to: "/settings/preferences", label: "Preferences", icon: SlidersHorizontal },
      { to: "/settings/security", label: "Security", icon: Shield },
      { to: "/settings/api-key", label: "API Key", icon: Key },
    ],
  },
  {
    label: "TRANSACTIONS",
    items: [
      { to: "/settings/categories", label: "Categories", icon: ChartPieIcon },
      { to: "/settings/tags", label: "Tags", icon: Tag },
      { to: "/settings/merchants", label: "Merchants", icon: Store },
      { to: "/settings/rules", label: "Rules", icon: Workflow },
    ],
  },
] as const;

function SettingsLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void navigate({ to: "/login" });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="h-8 w-8 animate-spin text-primary"
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
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 flex h-screen w-60 flex-col border-r border-border bg-card">
        <div className="border-b border-border px-4 py-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={14} />
            Back
          </Link>
          <h1 className="mt-2 font-heading text-lg font-semibold">Settings</h1>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-6">
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = matchRoute({ to: item.to, fuzzy: true });
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                      )}
                    >
                      <Icon size={16} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mb-6">
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              MORE
            </p>
            <button
              onClick={() => void signOut().then(() => navigate({ to: "/login" }))}
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
