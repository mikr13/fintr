import { cn, formatCurrency } from "~/lib/utils";

interface CategoryRowProps {
  name: string;
  icon?: string | null;
  color?: string | null;
  spent: number;
  budgeted: number;
  currency: string;
}

function getProgressColor(percentage: number): string {
  if (percentage >= 90) return "bg-red-500";
  if (percentage >= 50) return "bg-amber-500";
  return "bg-emerald-500";
}

export function CategoryRow({
  name,
  color,
  spent,
  budgeted,
  currency,
}: CategoryRowProps) {
  const percentage = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0;
  const isOverBudget = spent > budgeted;

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: color ?? "hsl(var(--muted))" }}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium">{name}</span>
          <span
            className={cn(
              "shrink-0 text-sm tabular-nums",
              isOverBudget ? "text-red-500" : "text-muted-foreground",
            )}
          >
            {formatCurrency(spent, currency)}{" "}
            <span className="text-muted-foreground/60">
              / {formatCurrency(budgeted, currency)}
            </span>
          </span>
        </div>

        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              getProgressColor(percentage),
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
