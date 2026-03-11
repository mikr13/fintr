import { api } from "convex/_generated/api.js";
import type { Id } from "convex/_generated/dataModel.js";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRightLeft,
  CalendarIcon,
  ChevronDown,
  Minus,
  Plus,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import type { TransactionType } from "~/lib/constants";
import { cn, formatDate } from "~/lib/utils";

interface EditTransaction {
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

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTransaction?: EditTransaction | null;
}

export function TransactionForm({
  open,
  onOpenChange,
  editTransaction,
}: TransactionFormProps) {
  const isEditing = !!editTransaction;

  const [type, setType] = useState<TransactionType>(
    (editTransaction?.type as TransactionType) ?? "expense",
  );
  const [description, setDescription] = useState(
    editTransaction?.description ?? "",
  );
  const [accountId, setAccountId] = useState<string>(
    editTransaction?.accountId ?? "",
  );
  const [amount, setAmount] = useState(
    editTransaction?.amount?.toString() ?? "",
  );
  const [categoryId, setCategoryId] = useState<string>(
    editTransaction?.categoryId ?? "",
  );
  const [date, setDate] = useState<Date>(
    editTransaction?.date ? new Date(editTransaction.date) : new Date(),
  );
  const [notes, setNotes] = useState(editTransaction?.notes ?? "");
  const [transferToAccountId, setTransferToAccountId] = useState<string>(
    editTransaction?.transferToAccountId ?? "",
  );
  const [showDetails, setShowDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const accounts = useQuery(api.accounts.list) as
    | Array<{
      _id: Id<"accounts">;
      name: string;
      currency: string;
      type: string;
    }>
    | undefined;
  const categories = useQuery(api.categories.list) as
    | Array<{
      _id: Id<"categories">;
      name: string;
      type: string;
      color?: string;
    }>
    | undefined;

  const createTx = useMutation(api.transactions.create);
  const updateTx = useMutation(api.transactions.update);

  const resetForm = useCallback(() => {
    setDescription("");
    setAccountId("");
    setAmount("");
    setCategoryId("");
    setDate(new Date());
    setNotes("");
    setTransferToAccountId("");
    setShowDetails(false);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;
    if (!accountId) return;
    if (!description.trim() && type !== "transfer") return;

    setSubmitting(true);
    try {
      const dateStr = date.toISOString().split("T")[0]!;
      const account = accounts?.find((a) => a._id === accountId);
      const currency = account?.currency ?? "USD";

      if (isEditing && editTransaction) {
        await updateTx({
          id: editTransaction._id,
          type,
          description: type === "transfer" ? "Transfer" : description,
          accountId: accountId as Id<"accounts">,
          amount: parsedAmount,
          currency,
          categoryId: categoryId
            ? (categoryId as Id<"categories">)
            : undefined,
          date: dateStr,
          notes: notes || undefined,
          transferToAccountId:
            type === "transfer" && transferToAccountId
              ? (transferToAccountId as Id<"accounts">)
              : undefined,
        });
        toast.success("Transaction updated");
      } else {
        await createTx({
          type,
          description: type === "transfer" ? "Transfer" : description,
          accountId: accountId as Id<"accounts">,
          amount: parsedAmount,
          currency,
          categoryId: categoryId
            ? (categoryId as Id<"categories">)
            : undefined,
          date: dateStr,
          notes: notes || undefined,
          tags: undefined,
          transferToAccountId:
            type === "transfer" && transferToAccountId
              ? (transferToAccountId as Id<"accounts">)
              : undefined,
          source: "web",
        });
        toast.success("Transaction added");
      }

      resetForm();
      onOpenChange(false);
    } catch {
      toast.error(isEditing ? "Failed to update transaction" : "Failed to add transaction");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredCategories = categories?.filter(
    (c) => c.type === type || type === "transfer",
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit transaction" : "New transaction"}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={type}
          onValueChange={(v) => setType(v as TransactionType)}
          className="w-full"
        >
          <TabsList className="w-full">
            <TabsTrigger value="expense" className="flex-1 gap-1.5">
              <Minus className="h-3.5 w-3.5" />
              Expense
            </TabsTrigger>
            <TabsTrigger value="income" className="flex-1 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Income
            </TabsTrigger>
            <TabsTrigger value="transfer" className="flex-1 gap-1.5">
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Transfer
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {type === "transfer" ? (
              <TransferFields
                accounts={accounts ?? []}
                fromId={accountId}
                onFromChange={setAccountId}
                toId={transferToAccountId}
                onToChange={setTransferToAccountId}
                amount={amount}
                onAmountChange={setAmount}
                date={date}
                onDateChange={setDate}
              />
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    placeholder="e.g. Groceries, Rent payment..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="account">Account *</Label>
                    <Select value={accountId} onValueChange={setAccountId}>
                      <SelectTrigger id="account">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {(accounts ?? []).map((acc) => (
                          <SelectItem key={acc._id} value={acc._id}>
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {(filteredCategories ?? []).map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <DatePicker date={date} onDateChange={setDate} />
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        showDetails && "rotate-180",
                      )}
                    />
                    Details
                  </button>
                  {showDetails && (
                    <div className="mt-3 space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Optional notes..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="min-h-[60px] resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* TabsContent wrappers needed for Radix but content is above */}
            <TabsContent value="expense" className="mt-0 p-0" />
            <TabsContent value="income" className="mt-0 p-0" />
            <TabsContent value="transfer" className="mt-0 p-0" />

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : type === "transfer"
                    ? "Create transfer"
                    : "Add transaction"}
            </Button>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ─── Transfer Fields ─────────────────────────────────────────────────────────

interface TransferFieldsProps {
  accounts: Array<{ _id: Id<"accounts">; name: string }>;
  fromId: string;
  onFromChange: (v: string) => void;
  toId: string;
  onToChange: (v: string) => void;
  amount: string;
  onAmountChange: (v: string) => void;
  date: Date;
  onDateChange: (d: Date) => void;
}

function TransferFields({
  accounts,
  fromId,
  onFromChange,
  toId,
  onToChange,
  amount,
  onAmountChange,
  date,
  onDateChange,
}: TransferFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>From *</Label>
        <Select value={fromId} onValueChange={onFromChange}>
          <SelectTrigger>
            <SelectValue placeholder="Source account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((acc) => (
              <SelectItem key={acc._id} value={acc._id}>
                {acc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>To *</Label>
        <Select value={toId} onValueChange={onToChange}>
          <SelectTrigger>
            <SelectValue placeholder="Destination account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((acc) => (
              <SelectItem key={acc._id} value={acc._id}>
                {acc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Amount *</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Date *</Label>
          <DatePicker date={date} onDateChange={onDateChange} />
        </div>
      </div>
    </>
  );
}

// ─── Date Picker ─────────────────────────────────────────────────────────────

function DatePicker({
  date,
  onDateChange,
}: {
  date: Date;
  onDateChange: (d: Date) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {date ? formatDate(date) : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (d) {
              onDateChange(d);
              setOpen(false);
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
