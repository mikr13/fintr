import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api.js";
import { PanelLeftClose, PanelLeftOpen, Wallet } from "lucide-react";
import { formatCurrency } from "~/lib/utils";
import { ACCOUNT_TYPES } from "~/lib/constants";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ScrollArea } from "~/components/ui/scroll-area";
import { PlusIcon } from "~/components/icons/plus";
import { AccountCard } from "~/components/accounts/account-card";
import { AccountTypePicker } from "~/components/accounts/account-type-picker";
import { AccountForm } from "~/components/accounts/account-form";

type AccountTab = "assets" | "debts" | "all";

type Account = {
  _id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  isDebt: boolean;
};

function AccountGroup({
  type,
  accounts,
}: {
  type: string;
  accounts: Account[];
}) {
  const typeDef = ACCOUNT_TYPES.find((t) => t.id === type);
  const total = accounts.reduce((sum, a) => sum + a.balance, 0);
  const currency = accounts[0]?.currency ?? "USD";

  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between px-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {typeDef?.name ?? type}
        </p>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {formatCurrency(total, currency)}
        </span>
      </div>
      <div className="space-y-0.5">
        {accounts.map((account) => (
          <AccountCard
            key={account._id}
            id={account._id}
            name={account.name}
            type={account.type}
            typeIcon={typeDef?.icon ?? "Wallet"}
            balance={account.balance}
            currency={account.currency}
            isDebt={account.isDebt}
          />
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
        Add your first {tab === "all" ? "account" : tab.slice(0, -1)} to start
        tracking
      </p>
    </div>
  );
}

function AccountsList({
  accounts,
  tab,
}: {
  accounts: Account[];
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

  const grouped = filtered.reduce<Record<string, Account[]>>((acc, item) => {
    const key = item.type;
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(item);
    return acc;
  }, {});

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<
    (typeof ACCOUNT_TYPES)[number] | null
  >(null);

  const accounts = (useQuery(api.accounts.list) ?? []) as Account[];

  const addLabel =
    tab === "assets"
      ? "+ New asset"
      : tab === "debts"
        ? "+ New debt"
        : "+ New account";

  const filterDebt =
    tab === "assets" ? false : tab === "debts" ? true : null;

  const handleAddClick = () => {
    setPickerOpen(true);
  };

  const handleTypeSelect = (type: (typeof ACCOUNT_TYPES)[number]) => {
    setSelectedType(type);
    setPickerOpen(false);
    setFormOpen(true);
  };

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
    <>
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

            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full gap-1.5 text-xs"
              onClick={handleAddClick}
            >
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

      <AccountTypePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleTypeSelect}
        filterDebt={filterDebt}
      />

      {selectedType && (
        <AccountForm
          open={formOpen}
          onOpenChange={setFormOpen}
          mode="create"
          accountType={selectedType}
        />
      )}
    </>
  );
}
