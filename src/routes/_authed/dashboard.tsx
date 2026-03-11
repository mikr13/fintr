import { createFileRoute } from "@tanstack/react-router";
import { useCurrentUser } from "~/hooks/use-current-user";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { PlusIcon } from "~/components/icons/plus";
import { Wallet } from "lucide-react";

export const Route = createFileRoute("/_authed/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useCurrentUser();

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
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
        <Button className="gap-2">
          <PlusIcon size={16} />
          New
        </Button>
      </div>

      <Card className="mt-8 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Wallet className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-heading text-lg font-semibold">No accounts yet</h3>
          <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
            Add your first account to start tracking your income, expenses, and
            net worth across your household.
          </p>
          <Button className="mt-6 gap-2">
            <PlusIcon size={16} />
            Add your first account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
