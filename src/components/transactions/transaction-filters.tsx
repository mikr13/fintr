import { SearchIcon } from "~/components/icons/search";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import type { TransactionType } from "~/lib/constants";

const TYPE_FILTERS: {
  value: TransactionType;
  label: string;
  activeClass: string;
}[] = [
  {
    value: "income",
    label: "Income",
    activeClass: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  },
  {
    value: "expense",
    label: "Expense",
    activeClass: "bg-red-500/15 text-red-500 border-red-500/30",
  },
  {
    value: "transfer",
    label: "Transfer",
    activeClass: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  },
];

interface TransactionFiltersProps {
  activeType: TransactionType | null;
  onTypeChange: (type: TransactionType | null) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

export function TransactionFilters({
  activeType,
  onTypeChange,
  search,
  onSearchChange,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        {TYPE_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() =>
              onTypeChange(activeType === filter.value ? null : filter.value)
            }
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              activeType === filter.value
                ? filter.activeClass
                : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="relative w-full sm:w-64">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
