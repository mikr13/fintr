import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api.js";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { formatCurrency, cn } from "~/lib/utils";
import { ACCOUNT_TYPES } from "~/lib/constants";
import { ChevronDown, ChevronRight } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  cash: "#3b82f6",
  investment: "#10b981",
  property: "#f59e0b",
  vehicle: "#8b5cf6",
  creditCard: "#ef4444",
  loan: "#ec4899",
  otherAsset: "#06b6d4",
  otherLiability: "#f97316",
};

interface TypeGroup {
  typeId: string;
  typeName: string;
  total: number;
  percentage: number;
  color: string;
  accounts: Array<{
    _id: string;
    name: string;
    balance: number;
    currency: string;
  }>;
}

export function AssetsBreakdown() {
  const accounts = useQuery(api.accounts.list);
  const netWorth = useQuery(api.accounts.getNetWorth);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  const toggleExpanded = (typeId: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(typeId)) {
        next.delete(typeId);
      } else {
        next.add(typeId);
      }
      return next;
    });
  };

  interface AccountDoc {
    _id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    isDebt: boolean;
  }

  const groups = useMemo<TypeGroup[]>(() => {
    if (!accounts || !netWorth) return [];

    const assetAccounts = (accounts as AccountDoc[]).filter(
      (a: AccountDoc) => !a.isDebt,
    );
    const assetsTotal = netWorth.assetsTotal;
    if (assetsTotal === 0) return [];

    const grouped = new Map<string, AccountDoc[]>();
    for (const account of assetAccounts) {
      const existing = grouped.get(account.type) ?? [];
      existing.push(account);
      grouped.set(account.type, existing);
    }

    return Array.from(grouped.entries())
      .map(([typeId, typeAccounts]) => {
        const total = typeAccounts.reduce(
          (sum: number, a: AccountDoc) => sum + a.balance,
          0,
        );
        const typeInfo = ACCOUNT_TYPES.find((t) => t.id === typeId);
        return {
          typeId,
          typeName: typeInfo?.name ?? typeId,
          total,
          percentage: (total / assetsTotal) * 100,
          color: TYPE_COLORS[typeId] ?? "#71717a",
          accounts: typeAccounts.map((a: AccountDoc) => ({
            _id: a._id,
            name: a.name,
            balance: a.balance,
            currency: a.currency,
          })),
        };
      })
      .sort((a: TypeGroup, b: TypeGroup) => b.total - a.total);
  }, [accounts, netWorth]);

  if (accounts === undefined || netWorth === undefined) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-muted-foreground">
            Assets
          </h3>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              No assets to display
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-0">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">Assets</h3>
          <span className="text-sm text-muted-foreground">·</span>
          <span className="font-heading text-sm font-semibold">
            {formatCurrency(netWorth.assetsTotal)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stacked horizontal bar */}
        <div className="flex h-3 w-full overflow-hidden rounded-full">
          {groups.map((group) => (
            <div
              key={group.typeId}
              className="transition-all duration-300"
              style={{
                width: `${group.percentage}%`,
                backgroundColor: group.color,
                minWidth: group.percentage > 0 ? "2px" : "0",
              }}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {groups.map((group) => (
            <div key={group.typeId} className="flex items-center gap-1.5 text-xs">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: group.color }}
              />
              <span className="text-muted-foreground">{group.typeName}</span>
              <span className="font-medium">{group.percentage.toFixed(0)}%</span>
            </div>
          ))}
        </div>

        {/* Breakdown table */}
        <div className="mt-5 space-y-0.5">
          <div className="grid grid-cols-[1fr_120px_100px] gap-2 px-2 pb-2 text-xs font-medium text-muted-foreground">
            <span>NAME</span>
            <span>WEIGHT</span>
            <span className="text-right">VALUE</span>
          </div>

          {groups.map((group) => {
            const isExpanded = expandedTypes.has(group.typeId);
            return (
              <div key={group.typeId}>
                <button
                  onClick={() => toggleExpanded(group.typeId)}
                  className={cn(
                    "grid w-full grid-cols-[1fr_120px_100px] items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted/50",
                    isExpanded && "bg-muted/30",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {group.accounts.length > 1 ? (
                      isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      )
                    ) : (
                      <span className="w-3.5" />
                    )}
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="font-medium">{group.typeName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${group.percentage}%`,
                          backgroundColor: group.color,
                        }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs text-muted-foreground">
                      {group.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <span className="text-right font-medium">
                    {formatCurrency(group.total)}
                  </span>
                </button>

                {isExpanded &&
                  group.accounts.map((account) => {
                    const accountPct =
                      netWorth.assetsTotal > 0
                        ? (account.balance / netWorth.assetsTotal) * 100
                        : 0;
                    return (
                      <div
                        key={account._id}
                        className="grid grid-cols-[1fr_120px_100px] items-center gap-2 px-2 py-1.5 pl-11 text-sm text-muted-foreground"
                      >
                        <span>{account.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${accountPct}%`,
                                backgroundColor: group.color,
                                opacity: 0.6,
                              }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs">
                            {accountPct.toFixed(0)}%
                          </span>
                        </div>
                        <span className="text-right">
                          {formatCurrency(account.balance)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
