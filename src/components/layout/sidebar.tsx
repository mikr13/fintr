import { Link, useMatchRoute } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { HomeIcon } from "~/components/icons/home";
import { ChartPieIcon } from "~/components/icons/chart-pie";
import { UserMenu } from "~/components/layout/user-menu";

const navItems = [
  { to: "/dashboard", label: "Home", icon: "home" },
  { to: "/transactions", label: "Transactions", icon: "receipt" },
  { to: "/budgets", label: "Budgets", icon: "chart-pie" },
] as const;

function NavIcon({
  icon,
  size = 20,
}: {
  icon: (typeof navItems)[number]["icon"];
  size?: number;
}) {
  switch (icon) {
    case "home":
      return <HomeIcon size={size} />;
    case "receipt":
      return <Receipt size={size} />;
    case "chart-pie":
      return <ChartPieIcon size={size} />;
  }
}

export function Sidebar() {
  const matchRoute = useMatchRoute();

  return (
    <aside className="flex h-full w-16 flex-col items-center border-r border-sidebar-border bg-[hsl(var(--sidebar-background))] py-4">
      <Link
        to="/"
        className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 font-heading text-lg font-bold tracking-tight text-primary transition-colors hover:bg-primary/25"
      >
        F
      </Link>

      <TooltipProvider delayDuration={0}>
        <nav className="flex flex-1 flex-col items-center gap-1">
          {navItems.map((item) => {
            const isActive = matchRoute({ to: item.to, fuzzy: true });
            return (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-foreground transition-colors",
                      isActive
                        ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]"
                        : "hover:bg-[hsl(var(--sidebar-accent))]/50 hover:text-[hsl(var(--sidebar-accent-foreground))]"
                    )}
                  >
                    <NavIcon icon={item.icon} size={20} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </TooltipProvider>

      <div className="mt-auto">
        <UserMenu />
      </div>
    </aside>
  );
}
