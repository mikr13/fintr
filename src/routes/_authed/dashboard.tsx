import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api.js";
import { useCurrentUser } from "~/hooks/use-current-user";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { PlusIcon } from "~/components/icons/plus";
import { NetWorthCard } from "~/components/dashboard/net-worth-card";
import { AssetsBreakdown } from "~/components/dashboard/assets-breakdown";
import { PageTransition } from "~/components/layout/page-transition";
import { Wallet, Receipt } from "lucide-react";

export const Route = createFileRoute("/_authed/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useCurrentUser();
  const accounts = useQuery(api.accounts.list);
  const [quickActionOpen, setQuickActionOpen] = useState(false);

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const hasAccounts = accounts !== undefined && accounts.length > 0;

  return (
    <PageTransition>
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here&apos;s what&apos;s happening with your finances
          </p>
        </div>
        <Button className="gap-2" onClick={() => setQuickActionOpen(true)}>
          <PlusIcon size={16} />
          New
        </Button>
      </div>

      {hasAccounts ? (
        <div className="mt-8 space-y-6">
          <NetWorthCard />
          <AssetsBreakdown />
        </div>
      ) : (
        <Card className="mt-8 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Wallet className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-heading text-lg font-semibold">
              No accounts yet
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
              Add your first account to start tracking your income, expenses,
              and net worth across your household.
            </p>
            <Button
              className="mt-6 gap-2"
              onClick={() => setQuickActionOpen(true)}
            >
              <PlusIcon size={16} />
              Add your first account
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={quickActionOpen} onOpenChange={setQuickActionOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Quick Actions</DialogTitle>
            <DialogDescription>
              What would you like to add?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <button
              className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
              onClick={() => setQuickActionOpen(false)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Add Account</p>
                <p className="text-xs text-muted-foreground">
                  Bank, investment, credit card, etc.
                </p>
              </div>
            </button>
            <button
              className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
              onClick={() => setQuickActionOpen(false)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-positive/10">
                <Receipt className="h-5 w-5 text-positive" />
              </div>
              <div>
                <p className="font-medium">Add Transaction</p>
                <p className="text-xs text-muted-foreground">
                  Income, expense, or transfer
                </p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </PageTransition>
  );
}
