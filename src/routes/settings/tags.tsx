import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api.js";
import type { Id } from "../../../convex/_generated/dataModel.js";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/tags")({
  component: TagsPage,
});

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
  "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
];

type TagFormData = {
  name: string;
  color: string;
};

const EMPTY_FORM: TagFormData = { name: "", color: "#3b82f6" };

function TagsPage() {
  const tags = useQuery(api.tags.list);
  const createTag = useMutation(api.tags.create);
  const updateTag = useMutation(api.tags.update);
  const removeTag = useMutation(api.tags.remove);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"tags"> | null>(null);
  const [form, setForm] = useState<TagFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (tag: { _id: Id<"tags">; name: string; color?: string }) => {
    setEditingId(tag._id);
    setForm({ name: tag.name, color: tag.color ?? "#3b82f6" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateTag({ id: editingId, name: form.name, color: form.color });
        toast.success("Tag updated");
      } else {
        await createTag({ name: form.name, color: form.color });
        toast.success("Tag created");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: Id<"tags">) => {
    try {
      await removeTag({ id });
      toast.success("Tag deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Tags
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create tags to label and filter transactions
        </p>
      </div>

      <div>
        <Button className="gap-1.5" onClick={openCreate}>
          <Plus size={14} />
          New tag
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {!tags || tags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No tags yet. Create one to get started.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tags.map((tag) => (
                <div
                  key={tag._id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color ?? "#888" }}
                  />
                  <span className="flex-1 text-sm font-medium">{tag.name}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => openEdit(tag)}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(tag._id)}
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
              {editingId ? "Edit Tag" : "New Tag"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Name</Label>
              <Input
                id="tag-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Recurring"
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setForm((f) => ({ ...f, color }))}
                    className="relative h-7 w-7 rounded-full transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                  >
                    {form.color === color && (
                      <div className="absolute inset-0 rounded-full ring-2 ring-foreground ring-offset-2 ring-offset-background" />
                    )}
                  </button>
                ))}
              </div>
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
