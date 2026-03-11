import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen, Wallet } from "lucide-react";
import { cn } from "~/lib/utils";
import { formatCurrency } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ScrollArea } from "~/components/ui/scroll-area";
import { PlusIcon } from "~/components/icons/plus";

type AccountTab = "assets" | "debts" | "all";

interface AccountItem {
  _id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  isDebt: boolean;
}

function AccountGroup({
  type,
  accounts,
}: {
  type: string;
  accounts: AccountItem[];
}) {
  return (
    <div className="mb-3">
      <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {type}
      </p>
      <div className="space-y-0.5">
        {accounts.map((account) => (
          <button
            key={account._id}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent/50"
          >
            <span className="truncate font-medium">{account.name}</span>
            <span
              className={cn(
                "ml-2 shrink-0 tabular-nums",
                account.isDebt ? "text-negative" : "text-foreground"
              )}
            >
              {formatCurrency(account.balance, account.currency)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: AccountTab }) {
  const label =
    tab === "assets"
      ? "assets"
      : tab === "debts"
        ? "debts"
        : "accounts";
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Wallet className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No {label} yet</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Add your first {tab === "all" ? "account" : tab.slice(0, -1)} to start tracking
      </p>
    </div>
  );
}

function AccountsList({
  accounts,
  tab,
}: {
  accounts: AccountItem[];
  tab: AccountTab;
}) {
  const filtered =
    tab === "assets"
      ? accounts.filter((a) => !a.isDebt)
      : tab === "debts"
        ? accounts.filter((a) => a.isDebt)
        : accounts;

  if (filtered.length === 0) {
    return <EmptyState tab={tab} />;
  }

  const grouped = filtered.reduce<Record<string, AccountItem[]>>(
    (acc, item) => {
      const key = item.type;
      if (!acc[key]) acc[key] = [];
      acc[key]!.push(item);
      return acc;
    },
    {}
  );

  return (
    <div className="py-2">
      {Object.entries(grouped).map(([type, items]) => (
        <AccountGroup key={type} type={type} accounts={items} />
      ))}
    </div>
  );
}

export function AccountsPanel() {
  const [tab, setTab] = useState<AccountTab>("assets");
  const [collapsed, setCollapsed] = useState(false);

  // Placeholder: no query yet. Once convex/accounts.ts has a `list` query, replace with:
  // const accounts = useQuery(api.accounts.list) ?? [];
  const accounts: AccountItem[] = [];

  const addLabel =
    tab === "assets"
      ? "+ New asset"
      : tab === "debts"
        ? "+ New debt"
        : "+ New account";

  if (collapsed) {
    return (
      <div className="flex h-full w-10 flex-col items-center border-r border-border bg-card pt-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCollapsed(false)}
        >
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-[260px] flex-col border-r border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h2 className="font-heading text-sm font-semibold">Accounts</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCollapsed(true)}
        >
          <PanelLeftClose className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="px-3 pt-3">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as AccountTab)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="assets" className="flex-1 text-xs">
              Assets
            </TabsTrigger>
            <TabsTrigger value="debts" className="flex-1 text-xs">
              Debts
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1 text-xs">
              All
            </TabsTrigger>
          </TabsList>

          <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5 text-xs">
            <PlusIcon size={14} />
            {addLabel}
          </Button>

          <ScrollArea className="mt-2 h-[calc(100vh-200px)]">
            <TabsContent value="assets" className="mt-0">
              <AccountsList accounts={accounts} tab="assets" />
            </TabsContent>
            <TabsContent value="debts" className="mt-0">
              <AccountsList accounts={accounts} tab="debts" />
            </TabsContent>
            <TabsContent value="all" className="mt-0">
              <AccountsList accounts={accounts} tab="all" />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}
