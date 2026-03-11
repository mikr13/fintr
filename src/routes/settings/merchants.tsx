import { createFileRoute } from "@tanstack/react-router";
import { api } from "convex/_generated/api.js";
import type { Id } from "convex/_generated/dataModel.js";
import { useMutation, useQuery } from "convex/react";
import { Pencil, Plus, Store, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export const Route = createFileRoute("/settings/merchants")({
  component: MerchantsPage,
});

function MerchantsPage() {
  const merchants = useQuery(api.merchants.list);
  const createMerchant = useMutation(api.merchants.create);
  const updateMerchant = useMutation(api.merchants.update);
  const removeMerchant = useMutation(api.merchants.remove);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"merchants"> | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setDialogOpen(true);
  };

  const openEdit = (merchant: { _id: Id<"merchants">; name: string }) => {
    setEditingId(merchant._id);
    setName(merchant.name);
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
        await updateMerchant({ id: editingId, name });
        toast.success("Merchant updated");
      } else {
        await createMerchant({ name });
        toast.success("Merchant created");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: Id<"merchants">) => {
    try {
      await removeMerchant({ id });
      toast.success("Merchant deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Merchants
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Track where you spend and earn
        </p>
      </div>

      <div>
        <Button className="gap-1.5" onClick={openCreate}>
          <Plus size={14} />
          New merchant
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {!merchants || merchants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Store size={18} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No merchants yet. Create one to get started.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {merchants.map((merchant) => (
                <div
                  key={merchant._id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Store size={14} />
                  </div>
                  <span className="flex-1 text-sm font-medium">
                    {merchant.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => openEdit(merchant)}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(merchant._id)}
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
              {editingId ? "Edit Merchant" : "New Merchant"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="merchant-name">Name</Label>
              <Input
                id="merchant-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Whole Foods"
              />
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
