import { Link, useMatches } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

const routeLabels: Record<string, string> = {
  "/": "Home",
  "/dashboard": "Home",
  "/transactions": "Transactions",
  "/budgets": "Budgets",
  "/settings": "Settings",
  "/settings/profile": "Profile",
  "/settings/preferences": "Preferences",
  "/settings/security": "Security",
  "/settings/api-key": "API Key",
  "/settings/categories": "Categories",
  "/settings/tags": "Tags",
  "/settings/merchants": "Merchants",
  "/settings/rules": "Rules",
};

export function Breadcrumbs() {
  const matches = useMatches();

  const seen = new Set<string>();
  const crumbs = matches
    .filter((match) => {
      const path = match.pathname;
      if (path === "/" || path.startsWith("/_")) return false;
      const label = routeLabels[path] ?? path.split("/").pop() ?? "";
      if (!label || seen.has(label)) return false;
      seen.add(label);
      return true;
    })
    .map((match) => ({
      path: match.pathname,
      label: routeLabels[match.pathname] ?? match.pathname.split("/").pop() ?? "",
    }));

  if (crumbs.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <div key={crumb.path} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            )}
            {isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.path}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
