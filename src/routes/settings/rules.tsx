import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api.js";
import type { Id } from "../../../convex/_generated/dataModel.js";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { Plus, Pencil, Trash2, Workflow } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/rules")({
  component: RulesPage,
});

function RulesPage() {
  const rules = useQuery(api.transactionRules.list);
  const createRule = useMutation(api.transactionRules.create);
  const updateRule = useMutation(api.transactionRules.update);
  const removeRule = useMutation(api.transactionRules.remove);
  const toggleRule = useMutation(api.transactionRules.toggle);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"transactionRules"> | null>(null);
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setEnabled(true);
    setDialogOpen(true);
  };

  const openEdit = (rule: { _id: Id<"transactionRules">; name: string; enabled: boolean }) => {
    setEditingId(rule._id);
    setName(rule.name);
    setEnabled(rule.enabled);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateRule({ id: editingId, name, enabled });
        toast.success("Rule updated");
      } else {
        await createRule({ name, conditions: {}, actions: {}, enabled });
        toast.success("Rule created");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: Id<"transactionRules">) => {
    try {
      await removeRule({ id });
      toast.success("Rule deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleToggle = async (id: Id<"transactionRules">) => {
    try {
      await toggleRule({ id });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Transaction Rules
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Automatically categorize and tag transactions based on conditions
        </p>
      </div>

      <div>
        <Button className="gap-1.5" onClick={openCreate}>
          <Plus size={14} />
          New rule
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {!rules || rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Workflow size={18} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No rules yet. Create one to auto-categorize transactions.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {rules.map((rule) => (
                <div
                  key={rule._id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => handleToggle(rule._id)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{rule.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {rule.enabled ? "Active" : "Disabled"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => openEdit(rule)}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(rule._id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingId ? "Edit Rule" : "New Rule"}
            </DialogTitle>
            <DialogDescription>
              Conditions and actions editor will be available in a future update.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rule-name">Name</Label>
              <Input
                id="rule-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Auto-categorize Uber rides"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="rule-enabled">Enabled</Label>
              <Switch
                id="rule-enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>

            <div className="rounded-md border border-dashed p-4">
              <p className="text-center text-xs text-muted-foreground">
                Conditions & actions editor coming soon.
                <br />
                Rules can be configured via API for now.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
