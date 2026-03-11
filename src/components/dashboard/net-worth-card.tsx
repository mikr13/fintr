import { api } from "convex/_generated/api.js";
import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { TrendingDownIcon } from "~/components/icons/trending-down";
import { TrendingUpIcon } from "~/components/icons/trending-up";
import {
  Card,
  CardContent,
  CardHeader,
} from "~/components/ui/card";
import { cn, formatCurrency, formatDate } from "~/lib/utils";
import { PeriodSelector } from "./period-selector";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="text-muted-foreground">{label ? formatDate(label, "MMM d, yyyy") : ""}</p>
      <p className="font-heading font-semibold">{formatCurrency(payload[0]!.value)}</p>
    </div>
  );
}

export function NetWorthCard() {
  const [period, setPeriod] = useState(30);
  const netWorth = useQuery(api.accounts.getNetWorth);
  const history = useQuery(api.accounts.getNetWorthHistory, { days: period });

  const { change, changePercent, isPositive } = useMemo(() => {
    if (!history || history.length < 2) {
      return { change: 0, changePercent: 0, isPositive: true };
    }
    const first = history[0]!.value;
    const last = history[history.length - 1]!.value;
    const diff = last - first;
    const pct = first !== 0 ? (diff / Math.abs(first)) * 100 : 0;
    return { change: diff, changePercent: pct, isPositive: diff >= 0 };
  }, [history]);

  const chartData = useMemo(() => {
    if (!history) return [];
    return history.map((point: { date: string; value: number }) => ({
      ...point,
      displayDate: formatDate(point.date, "MMM d"),
    }));
  }, [history]);

  if (netWorth === undefined) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-24 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="h-10 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-6 h-[200px] animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <h3 className="text-sm font-medium text-muted-foreground">Net Worth</h3>
        <PeriodSelector value={period} onChange={setPeriod} />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3">
          <span className="font-heading text-4xl font-bold tracking-tight">
            {formatCurrency(netWorth.total)}
          </span>

          {history && history.length >= 2 && (
            <div
              className={cn(
                "mb-1 flex items-center gap-1 text-sm font-medium",
                isPositive ? "text-positive" : "text-negative",
              )}
            >
              {isPositive ? (
                <TrendingUpIcon size={16} />
              ) : (
                <TrendingDownIcon size={16} />
              )}
              <span>
                {isPositive ? "+" : ""}
                {formatCurrency(change)}
              </span>
              <span className="text-muted-foreground">
                ({isPositive ? "+" : ""}
                {changePercent.toFixed(1)}%)
              </span>
            </div>
          )}
        </div>

        {chartData.length > 1 ? (
          <div className="mt-6 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
              >
                <defs>
                  <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={isPositive ? "var(--color-positive)" : "var(--color-negative)"}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor={isPositive ? "var(--color-positive)" : "var(--color-negative)"}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="displayDate"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={isPositive ? "var(--color-positive)" : "var(--color-negative)"}
                  strokeWidth={2}
                  fill="url(#netWorthGradient)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: isPositive ? "var(--color-positive)" : "var(--color-negative)",
                    strokeWidth: 0,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-6 flex h-[200px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              No net worth data yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
