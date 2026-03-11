import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Button } from "~/components/ui/button";
import { PlusIcon } from "~/components/icons/plus";
import { formatCurrency } from "~/lib/utils";

interface BudgetSegment {
  name: string;
  value: number;
  color: string;
}

interface BudgetChartProps {
  segments: BudgetSegment[];
  totalBudgeted: number;
  currency: string;
  onNewBudget: () => void;
}

export function BudgetChart({
  segments,
  totalBudgeted,
  currency,
  onNewBudget,
}: BudgetChartProps) {
  const hasData = segments.length > 0 && totalBudgeted > 0;

  const chartData = hasData
    ? segments
    : [{ name: "Empty", value: 1, color: "hsl(var(--muted))" }];

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[220px] w-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={hasData ? 2 : 0}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} opacity={0.85} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Budgeted</span>
          <span className="font-heading text-xl font-bold tracking-tight">
            {formatCurrency(totalBudgeted, currency)}
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="mt-4 gap-1.5"
        onClick={onNewBudget}
      >
        <PlusIcon size={14} />
        New budget
      </Button>
    </div>
  );
}
