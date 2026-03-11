import { useNavigate } from "@tanstack/react-router";
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
import { cn, formatCurrency } from "~/lib/utils";
import type { AccountTypeId } from "~/lib/constants";

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
  cash: "text-emerald-400",
  investment: "text-blue-400",
  property: "text-amber-400",
  vehicle: "text-violet-400",
  creditCard: "text-rose-400",
  loan: "text-orange-400",
  otherAsset: "text-teal-400",
  otherLiability: "text-red-400",
};

interface AccountCardProps {
  id: string;
  name: string;
  type: string;
  typeIcon: string;
  balance: number;
  currency: string;
  isDebt: boolean;
}

export function AccountCard({
  id,
  name,
  type,
  typeIcon,
  balance,
  currency,
  isDebt,
}: AccountCardProps) {
  const navigate = useNavigate();
  const Icon = ICON_MAP[typeIcon] ?? Wallet;

  return (
    <button
      onClick={() =>
        navigate({ to: "/accounts/$accountId", params: { accountId: id } })
      }
      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent/50"
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          TYPE_COLORS[type as AccountTypeId] ?? "text-muted-foreground",
        )}
      />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {name}
      </span>
      <span
        className={cn(
          "shrink-0 text-sm tabular-nums",
          isDebt ? "text-negative" : "text-foreground",
        )}
      >
        {formatCurrency(balance, currency)}
      </span>
    </button>
  );
}
