import { useState, useCallback, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  Home,
  Car,
  CreditCard,
  Landmark,
  Plus,
  Minus,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import { ACCOUNT_TYPES, type AccountTypeId } from "~/lib/constants";

const ICON_MAP: Record<string, LucideIcon> = {
  Wallet,
  TrendingUp,
  Home,
  Car,
  CreditCard,
  Landmark,
  Plus,
  Minus,
};

const TYPE_COLORS: Record<AccountTypeId, string> = {
  cash: "bg-emerald-500/15 text-emerald-400",
  investment: "bg-blue-500/15 text-blue-400",
  property: "bg-amber-500/15 text-amber-400",
  vehicle: "bg-violet-500/15 text-violet-400",
  creditCard: "bg-rose-500/15 text-rose-400",
  loan: "bg-orange-500/15 text-orange-400",
  otherAsset: "bg-teal-500/15 text-teal-400",
  otherLiability: "bg-red-500/15 text-red-400",
};

interface AccountTypePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: (typeof ACCOUNT_TYPES)[number]) => void;
  filterDebt?: boolean | null;
}

export function AccountTypePicker({
  open,
  onOpenChange,
  onSelect,
  filterDebt = null,
}: AccountTypePickerProps) {
  const [focusIndex, setFocusIndex] = useState(0);

  const filtered =
    filterDebt === null
      ? ACCOUNT_TYPES
      : ACCOUNT_TYPES.filter((t) => t.isDebt === filterDebt);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusIndex((i) => (i + 1) % filtered.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusIndex((i) => (i - 1 + filtered.length) % filtered.length);
          break;
        case "Enter":
          e.preventDefault();
          onSelect(filtered[focusIndex]!);
          break;
      }
    },
    [filtered, focusIndex, onSelect],
  );

  useEffect(() => {
    setFocusIndex(0);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm gap-0 p-0"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="font-heading text-base">
            What would you like to add?
          </DialogTitle>
          <DialogDescription className="text-xs">
            Choose an account type to get started
          </DialogDescription>
        </DialogHeader>

        <div className="px-2 pb-2">
          {filtered.map((type, index) => {
            const Icon = ICON_MAP[type.icon] ?? Wallet;
            return (
              <button
                key={type.id}
                onClick={() => onSelect(type)}
                onMouseEnter={() => setFocusIndex(index)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                  index === focusIndex
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-accent/50",
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    TYPE_COLORS[type.id],
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-sm font-medium">{type.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {type.isDebt ? "Liability" : "Asset"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 border-t border-border px-5 py-2.5 text-[11px] text-muted-foreground">
          <span>
            Select{" "}
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
              ↵
            </kbd>
          </span>
          <span>
            Navigate{" "}
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
              ↑
            </kbd>{" "}
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
              ↓
            </kbd>
          </span>
          <span>
            Close{" "}
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
              ESC
            </kbd>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
