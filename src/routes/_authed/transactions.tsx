import { createFileRoute } from "@tanstack/react-router";
import { api } from "convex/_generated/api.js";
import type { Id } from "convex/_generated/dataModel.js";
import { useMutation, useQuery } from "convex/react";
import { Receipt, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { PlusIcon } from "~/components/icons/plus";
import { TrendingDownIcon } from "~/components/icons/trending-down";
import { TrendingUpIcon } from "~/components/icons/trending-up";
import { PageTransition } from "~/components/layout/page-transition";
import { TransactionFilters } from "~/components/transactions/transaction-filters";
import { TransactionForm } from "~/components/transactions/transaction-form";
import { TransactionTable } from "~/components/transactions/transaction-table";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import type { TransactionType } from "~/lib/constants";
import { formatCurrency } from "~/lib/utils";

export const Route = createFileRoute("/_authed/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const [typeFilter, setTypeFilter] = useState<TransactionType | null>(null);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTx, setEditTx] = useState<EditTx | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [cursors, setCursors] = useState<string[]>([]);

  const currentCursor = cursors[cursors.length - 1] ?? undefined;

  const data = useQuery(api.transactions.list, {
    type: typeFilter ?? undefined,
    search: search || undefined,
    limit: 20,
    cursor: currentCursor,
  });

  const summary = useQuery(api.transactions.getSummary);
  const bulkDeleteMut = useMutation(api.transactions.bulkDelete);

  const transactions = data?.transactions ?? [];
  const hasMore = data?.hasMore ?? false;

  const handleLoadMore = useCallback(() => {
    if (data?.nextCursor) {
      setCursors((prev) => [...prev, data.nextCursor!]);
      setSelectedIds(new Set());
    }
  }, [data?.nextCursor]);

  const handleLoadPrevious = useCallback(() => {
    setCursors((prev) => prev.slice(0, -1));
    setSelectedIds(new Set());
  }, []);

  const handleRowClick = useCallback(
    (tx: { _id: Id<"transactions">; type: string; description: string; amount: number; currency: string; date: string;[key: string]: unknown }) => {
      setEditTx({
        _id: tx._id,
        type: tx.type,
        description: tx.description,
        accountId: tx.accountId as Id<"accounts">,
        amount: tx.amount,
        currency: tx.currency,
        categoryId: tx.categoryId as Id<"categories"> | undefined,
        date: tx.date,
        notes: tx.notes as string | undefined,
        transferToAccountId: tx.transferToAccountId as
          | Id<"accounts">
          | undefined,
      });
      setFormOpen(true);
    },
    [],
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkDeleteMut({
        ids: Array.from(selectedIds) as Id<"transactions">[],
      });
      toast.success(`${selectedIds.size} transaction${selectedIds.size > 1 ? "s" : ""} deleted`);
      setSelectedIds(new Set());
    } catch {
      toast.error("Failed to delete transactions");
    }
  }, [selectedIds, bulkDeleteMut]);

  const handleFormClose = useCallback(
    (open: boolean) => {
      setFormOpen(open);
      if (!open) setEditTx(null);
    },
    [],
  );

  return (
    <PageTransition>
      <div>
        <div className="flex items-start justify-between">
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Transactions
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled>
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <PlusIcon size={16} />
              New transaction
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Receipt className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-semibold tabular-nums">
                  {summary?.total ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUpIcon className="text-emerald-500" size={20} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Income</p>
                <p className="text-xl font-semibold tabular-nums text-emerald-500">
                  {formatCurrency(summary?.incomeTotal ?? 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                <TrendingDownIcon className="text-red-500" size={20} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p className="text-xl font-semibold tabular-nums text-red-500">
                  {formatCurrency(summary?.expenseTotal ?? 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <TransactionFilters
            activeType={typeFilter}
            onTypeChange={(t) => {
              setTypeFilter(t);
              setCursors([]);
              setSelectedIds(new Set());
            }}
            search={search}
            onSearchChange={(s) => {
              setSearch(s);
              setCursors([]);
              setSelectedIds(new Set());
            }}
          />
        </div>

        <div className="mt-4">
          <TransactionTable
            transactions={transactions}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onLoadPrevious={handleLoadPrevious}
            hasPrevious={cursors.length > 0}
            isLoading={data === undefined}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onRowClick={handleRowClick}
            onBulkDelete={handleBulkDelete}
          />
        </div>

        <TransactionForm
          open={formOpen}
          onOpenChange={handleFormClose}
          editTransaction={editTx}
        />
      </div>
    </PageTransition>
  );
}

interface EditTx {
  _id: Id<"transactions">;
  type: string;
  description: string;
  accountId: Id<"accounts">;
  amount: number;
  currency: string;
  categoryId?: Id<"categories">;
  date: string;
  notes?: string;
  transferToAccountId?: Id<"accounts">;
}
