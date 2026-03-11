import type { Id } from "convex/_generated/dataModel.js";
import { ChevronLeft, ChevronRight, Inbox, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cn, formatCurrency, formatDate } from "~/lib/utils";

interface Transaction {
  _id: Id<"transactions">;
  description: string;
  accountName: string;
  categoryName: string | null;
  categoryColor: string | null;
  type: string;
  amount: number;
  currency: string;
  date: string;
  [key: string]: unknown;
}

interface TransactionTableProps {
  transactions: Transaction[];
  hasMore: boolean;
  onLoadMore: () => void;
  onLoadPrevious: () => void;
  hasPrevious: boolean;
  isLoading: boolean;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onRowClick: (tx: Transaction) => void;
  onBulkDelete: () => void;
}

export function TransactionTable({
  transactions,
  hasMore,
  onLoadMore,
  onLoadPrevious,
  hasPrevious,
  isLoading,
  selectedIds,
  onSelectionChange,
  onRowClick,
  onBulkDelete,
}: TransactionTableProps) {
  const allSelected =
    transactions.length > 0 &&
    transactions.every((t) => selectedIds.has(t._id));

  function toggleAll() {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(transactions.map((t) => t._id)));
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  }

  if (!isLoading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Inbox className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="font-heading text-lg font-semibold">No transactions found</h3>
        <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
          Add a transaction, adjust your filters, or refine your search to see
          results here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <div className="h-5 w-full animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
              : transactions.map((tx) => (
                <TableRow
                  key={tx._id}
                  className="cursor-pointer"
                  data-state={selectedIds.has(tx._id) ? "selected" : undefined}
                  onClick={() => onRowClick(tx)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(tx._id)}
                      onCheckedChange={() => toggleOne(tx._id)}
                      aria-label={`Select ${tx.description}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {tx.description}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tx.accountName}
                  </TableCell>
                  <TableCell>
                    {tx.categoryName ? (
                      <span className="inline-flex items-center gap-1.5">
                        {tx.categoryColor && (
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: tx.categoryColor }}
                          />
                        )}
                        <span className="text-muted-foreground">
                          {tx.categoryName}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(tx.date)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono tabular-nums",
                      tx.type === "income" && "text-emerald-500",
                      tx.type === "expense" && "text-red-500",
                      tx.type === "transfer" && "text-blue-500",
                    )}
                  >
                    {tx.type === "income" ? "+" : tx.type === "expense" ? "−" : ""}
                    {formatCurrency(tx.amount, tx.currency)}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {selectedIds.size > 0 ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} transaction{selectedIds.size > 1 ? "s" : ""}{" "}
              selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrevious}
            onClick={onLoadPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore}
            onClick={onLoadMore}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
