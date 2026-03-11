import { cn } from "~/lib/utils";
import { PERIOD_OPTIONS } from "~/lib/constants";

interface PeriodSelectorProps {
  value: number;
  onChange: (days: number) => void;
  className?: string;
}

export function PeriodSelector({
  value,
  onChange,
  className,
}: PeriodSelectorProps) {
  return (
    <div className={cn("inline-flex items-center gap-0.5 rounded-lg bg-muted p-0.5", className)}>
      {PERIOD_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            value === option.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
