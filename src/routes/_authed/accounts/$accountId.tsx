import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api.js";
import type { Id } from "../../../../convex/_generated/dataModel.js";
import {
  Wallet,
  TrendingUp,
  Home,
  Car,
  CreditCard,
  Landmark,
  Plus,
  Minus,
  Pencil,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { cn, formatCurrency, formatDate } from "~/lib/utils";
import { ACCOUNT_TYPES, PERIOD_OPTIONS, type AccountTypeId } from "~/lib/constants";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { AccountForm } from "~/components/accounts/account-form";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/accounts/$accountId")({
  component: AccountDetailPage,
});

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

function CustomTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="text-sm font-medium tabular-nums">
        {formatCurrency(payload[0].value, currency)}
      </p>
    </div>
  );
}

function BalanceChart({
  accountId,
  currency,
  isDebt,
}: {
  accountId: Id<"accounts">;
  currency: string;
  isDebt: boolean;
}) {
  const [days, setDays] = useState(30);
  const history = useQuery(api.accounts.getBalanceHistory, {
    accountId,
    days,
  });

  const chartColor = isDebt
    ? "hsl(var(--destructive))"
    : "hsl(var(--chart-2))";

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Balance history</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No balance history yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Balance history</CardTitle>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={days === opt.value ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setDays(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={history}
            margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => {
                try {
                  return format(parseISO(d), "MMM d");
                } catch {
                  return d;
                }
              }}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => formatCurrency(v, currency)}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip
              content={<CustomTooltip currency={currency} />}
              cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={chartColor}
              strokeWidth={2}
              fill="url(#balanceGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function AccountDetailPage() {
  const { accountId } = Route.useParams();
  const navigate = useNavigate();
  const removeAccount = useMutation(api.accounts.remove);

  const account = useQuery(api.accounts.get, {
    accountId: accountId as Id<"accounts">,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (account === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading account...</p>
        </div>
      </div>
    );
  }

  if (account === null) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">Account not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This account may have been deleted or you don&apos;t have access.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate({ to: "/dashboard" })}
          >
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  const typeDef = ACCOUNT_TYPES.find((t) => t.id === account.type);
  const Icon = ICON_MAP[typeDef?.icon ?? "Wallet"] ?? Wallet;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await removeAccount({ accountId: account._id });
      toast.success("Account deleted");
      void navigate({ to: "/dashboard" });
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              TYPE_COLORS[account.type as AccountTypeId] ??
                "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                {account.name}
              </h1>
              <Badge variant="secondary" className="text-xs">
                {typeDef?.name ?? account.type}
              </Badge>
              {account.subtype && (
                <Badge variant="outline" className="text-xs">
                  {account.subtype}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Created {formatDate(account._creationTime)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">
            {account.isDebt ? "Amount owed" : "Current balance"}
          </p>
          <p
            className={cn(
              "mt-1 font-heading text-4xl font-bold tabular-nums tracking-tight",
              account.isDebt ? "text-negative" : "text-positive",
            )}
          >
            {formatCurrency(account.balance, account.currency)}
          </p>
        </CardContent>
      </Card>

      <BalanceChart
        accountId={account._id}
        currency={account.currency}
        isDebt={account.isDebt}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              Transactions for this account
            </p>
          </div>
        </CardContent>
      </Card>

      <AccountForm
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        accountType={{
          id: (account.type as AccountTypeId) ?? "cash",
          name: typeDef?.name ?? account.type,
          isDebt: account.isDebt,
        }}
        defaultValues={{
          _id: account._id,
          name: account.name,
          balance: account.balance,
          currency: account.currency,
          subtype: account.subtype,
        }}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Delete account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {account.name}
              </span>
              ? This will permanently remove all balance history. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
