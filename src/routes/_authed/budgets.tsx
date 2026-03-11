import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api.js";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { PlusIcon } from "~/components/icons/plus";
import { MonthNavigator } from "~/components/budgets/month-navigator";
import { BudgetChart } from "~/components/budgets/budget-chart";
import { CategoryRow } from "~/components/budgets/category-row";
import { formatCurrency } from "~/lib/utils";
import type { Id } from "../../../convex/_generated/dataModel.js";

interface CategoryDoc {
  _id: Id<"categories">;
  name: string;
  icon?: string;
  color?: string;
  type: string;
  isDefault: boolean;
}

interface BudgetWithCategory {
  _id: Id<"budgets">;
  categoryId: Id<"categories">;
  amount: number;
  spent: number;
  category: {
    _id: Id<"categories">;
    name: string;
    icon?: string;
    color?: string;
    type: string;
  } | null;
}

export const Route = createFileRoute("/_authed/budgets")({
  component: BudgetsPage,
});

function BudgetsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");

  const household = useQuery(api.households.get);
  const categories = useQuery(api.categories.list) as
    | CategoryDoc[]
    | undefined;
  const budgets = useQuery(api.budgets.listForMonth, { month, year }) as
    | BudgetWithCategory[]
    | undefined;
  const summary = useQuery(api.budgets.getSummary, { month, year });

  const createBudget = useMutation(api.budgets.create);
  const seedDefaults = useMutation(api.categories.seedDefaults);

  const currency = household?.currency ?? "USD";
  const isLoading =
    categories === undefined || budgets === undefined || summary === undefined;

  const hasCategories = categories && categories.length > 0;
  const hasBudgets = budgets && budgets.length > 0;

  const budgetedCategoryIds = new Set(
    budgets?.map((b: BudgetWithCategory) => b.categoryId) ?? [],
  );
  const availableCategories =
    categories?.filter(
      (c: CategoryDoc) =>
        c.type === "expense" && !budgetedCategoryIds.has(c._id),
    ) ?? [];

  function handleMonthChange(newMonth: number, newYear: number) {
    setMonth(newMonth);
    setYear(newYear);
  }

  async function handleCreateBudget() {
    if (!selectedCategory || !budgetAmount) return;
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) return;

    await createBudget({
      categoryId: selectedCategory as Id<"categories">,
      amount,
      month,
      year,
      currency,
    });

    setSelectedCategory("");
    setBudgetAmount("");
    setDialogOpen(false);
  }

  async function handleSeedDefaults() {
    await seedDefaults();
  }

  const chartSegments =
    budgets?.map((b: BudgetWithCategory) => ({
      name: b.category?.name ?? "Unknown",
      value: b.amount,
      color: b.category?.color ?? "#6b7280",
    })) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg
          className="h-6 w-6 animate-spin text-primary"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  if (!hasCategories) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">
              Budgets
            </h1>
            <p className="mt-1 text-muted-foreground">
              Plan and track your spending
            </p>
          </div>
          <MonthNavigator
            month={month}
            year={year}
            onChange={handleMonthChange}
          />
        </div>

        <Card className="mt-8 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <svg
                className="h-7 w-7 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                <path d="M22 12A10 10 0 0 0 12 2v10z" />
              </svg>
            </div>
            <h3 className="font-heading text-lg font-semibold">
              Oops! You have not created any budgets yet
            </h3>
            <p className="mt-1 max-w-md text-center text-sm text-muted-foreground">
              Start by setting up your spending categories. You can use our
              recommended defaults or create your own.
            </p>
            <div className="mt-6 flex gap-3">
              <Button onClick={handleSeedDefaults} className="gap-2">
                Use defaults (recommended)
              </Button>
              <Button variant="outline" className="gap-2">
                <PlusIcon size={16} />
                New category
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Budgets
          </h1>
          <p className="mt-1 text-muted-foreground">
            Plan and track your spending
          </p>
        </div>
        <MonthNavigator
          month={month}
          year={year}
          onChange={handleMonthChange}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <BudgetChart
                segments={chartSegments}
                totalBudgeted={summary?.totalBudgeted ?? 0}
                currency={currency}
                onNewBudget={() => setDialogOpen(true)}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3">
            <SummaryCard
              label="Income"
              value={summary?.incomeTotal ?? 0}
              currency={currency}
              variant="positive"
            />
            <SummaryCard
              label="Expenses"
              value={summary?.expenseTotal ?? 0}
              currency={currency}
              variant="negative"
            />
            <SummaryCard
              label="Remaining"
              value={summary?.remaining ?? 0}
              currency={currency}
              variant={
                (summary?.remaining ?? 0) >= 0 ? "positive" : "negative"
              }
            />
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Categories</h2>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => setDialogOpen(true)}
              >
                <PlusIcon size={14} />
                Add
              </Button>
            </div>

            {hasBudgets ? (
              <div className="mt-4 divide-y divide-border">
                {budgets.map((budget: BudgetWithCategory) => (
                  <CategoryRow
                    key={budget._id}
                    name={budget.category?.name ?? "Unknown"}
                    icon={budget.category?.icon}
                    color={budget.category?.color}
                    spent={budget.spent}
                    budgeted={budget.amount}
                    currency={currency}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-12">
                <p className="text-sm text-muted-foreground">
                  No budgets set for this month
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 gap-1.5"
                  onClick={() => setDialogOpen(true)}
                >
                  <PlusIcon size={14} />
                  Create your first budget
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Budget</DialogTitle>
            <DialogDescription>
              Set a spending limit for a category this month.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat: CategoryDoc) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: cat.color ?? "#6b7280",
                          }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                  {availableCategories.length === 0 && (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      All expense categories have budgets
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount ({currency})</Label>
              <Input
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBudget}
              disabled={!selectedCategory || !budgetAmount}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  currency,
  variant,
}: {
  label: string;
  value: number;
  currency: string;
  variant: "positive" | "negative" | "neutral";
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span
          className={
            variant === "positive"
              ? "font-semibold tabular-nums text-emerald-500"
              : variant === "negative"
                ? "font-semibold tabular-nums text-red-500"
                : "font-semibold tabular-nums"
          }
        >
          {formatCurrency(value, currency)}
        </span>
      </CardContent>
    </Card>
  );
}
