import { format, addMonths, subMonths, isSameMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";

interface MonthNavigatorProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export function MonthNavigator({ month, year, onChange }: MonthNavigatorProps) {
  const current = new Date(year, month - 1, 1);
  const today = new Date();
  const isCurrentMonth = isSameMonth(current, today);

  function handlePrev() {
    const prev = subMonths(current, 1);
    onChange(prev.getMonth() + 1, prev.getFullYear());
  }

  function handleNext() {
    const next = addMonths(current, 1);
    onChange(next.getMonth() + 1, next.getFullYear());
  }

  function handleToday() {
    onChange(today.getMonth() + 1, today.getFullYear());
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handlePrev}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="min-w-[140px] text-center font-heading text-lg font-semibold tracking-tight">
        {format(current, "MMMM yyyy")}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isCurrentMonth && (
        <Button
          variant="outline"
          size="sm"
          className="ml-2 h-7 text-xs"
          onClick={handleToday}
        >
          Today
        </Button>
      )}
    </div>
  );
}
