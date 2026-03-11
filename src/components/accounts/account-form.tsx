import { api } from "convex/_generated/api.js";
import type { Id } from "convex/_generated/dataModel.js";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  ACCOUNT_SUBTYPES,
  CURRENCIES,
  type AccountTypeId,
} from "~/lib/constants";

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  accountType: {
    id: AccountTypeId;
    name: string;
    isDebt: boolean;
  };
  defaultValues?: {
    _id: Id<"accounts">;
    name: string;
    balance: number;
    currency: string;
    subtype?: string;
  };
  onSuccess?: () => void;
}

export function AccountForm({
  open,
  onOpenChange,
  mode,
  accountType,
  defaultValues,
  onSuccess,
}: AccountFormProps) {
  const createAccount = useMutation(api.accounts.create);
  const updateAccount = useMutation(api.accounts.update);
  const updateBalance = useMutation(api.accounts.updateBalance);

  const [name, setName] = useState(defaultValues?.name ?? "");
  const [balance, setBalance] = useState(
    defaultValues?.balance?.toString() ?? "",
  );
  const [currency, setCurrency] = useState(defaultValues?.currency ?? "USD");
  const [subtype, setSubtype] = useState(defaultValues?.subtype ?? "");
  const [submitting, setSubmitting] = useState(false);

  const subtypes = ACCOUNT_SUBTYPES[accountType.id] ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) return;

    const parsedBalance = parseFloat(balance);
    if (isNaN(parsedBalance)) return;

    setSubmitting(true);
    try {
      if (mode === "create") {
        await createAccount({
          name: trimmedName,
          type: accountType.id,
          subtype: subtype || undefined,
          balance: parsedBalance,
          currency,
          isDebt: accountType.isDebt,
        });
        toast.success(`${accountType.name} account created`);
      } else if (defaultValues) {
        await updateAccount({
          accountId: defaultValues._id,
          name: trimmedName,
          subtype: subtype || undefined,
          currency,
        });
        if (parsedBalance !== defaultValues.balance) {
          await updateBalance({
            accountId: defaultValues._id,
            balance: parsedBalance,
          });
        }
        toast.success("Account updated");
      }
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast.error(
        mode === "create"
          ? "Failed to create account"
          : "Failed to update account",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {mode === "create"
              ? `Add ${accountType.name}`
              : "Edit account"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? `Set up your new ${accountType.name.toLowerCase()} account`
              : "Update your account details"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="account-name">Account name</Label>
            <Input
              id="account-name"
              placeholder={`e.g. ${accountType.name === "Cash" ? "Main Checking" : accountType.name}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-[1fr,auto] gap-3">
            <div className="space-y-2">
              <Label htmlFor="account-balance">
                {accountType.isDebt ? "Amount owed" : "Current balance"}
              </Label>
              <Input
                id="account-balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {subtypes.length > 0 && (
            <div className="space-y-2">
              <Label>Subtype</Label>
              <Select value={subtype} onValueChange={setSubtype}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subtype (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {subtypes.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting
                ? "Saving..."
                : mode === "create"
                  ? "Create account"
                  : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
