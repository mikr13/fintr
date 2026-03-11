import { createFileRoute } from "@tanstack/react-router";
import { api } from "convex/_generated/api.js";
import type { Id } from "convex/_generated/dataModel.js";
import { useMutation, useQuery } from "convex/react";
import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export const Route = createFileRoute("/settings/categories")({
  component: CategoriesPage,
});

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
  "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
];

type CategoryFormData = {
  name: string;
  type: string;
  color: string;
  icon: string;
};

const EMPTY_FORM: CategoryFormData = { name: "", type: "expense", color: "#3b82f6", icon: "" };

function CategoriesPage() {
  const categories = useQuery(api.categories.list);
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const removeCategory = useMutation(api.categories.remove);
  const seedDefaults = useMutation(api.categories.seedDefaults);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"categories"> | null>(null);
  const [form, setForm] = useState<CategoryFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (cat: {
    _id: Id<"categories">;
    name: string;
    type: string;
    color?: string;
    icon?: string;
  }) => {
    setEditingId(cat._id);
    setForm({
      name: cat.name,
      type: cat.type,
      color: cat.color ?? "#3b82f6",
      icon: cat.icon ?? "",
    });
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
        await updateCategory({
          id: editingId,
          name: form.name,
          type: form.type,
          color: form.color,
          icon: form.icon || undefined,
        });
        toast.success("Category updated");
      } else {
        await createCategory({
          name: form.name,
          type: form.type,
          color: form.color,
          icon: form.icon || undefined,
        });
        toast.success("Category created");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: Id<"categories">) => {
    try {
      await removeCategory({ id });
      toast.success("Category deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleSeedDefaults = async () => {
    try {
      await seedDefaults({});
      toast.success("Default categories added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to seed defaults");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Categories
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Organize your transactions with categories
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" className="gap-1.5" onClick={handleSeedDefaults}>
          <Sparkles size={14} />
          Use defaults (recommended)
        </Button>
        <Button className="gap-1.5" onClick={openCreate}>
          <Plus size={14} />
          New category
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {!categories || categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No categories yet. Add your own or use the defaults.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color ?? "#888" }}
                  />
                  <span className="flex-1 text-sm font-medium">{cat.name}</span>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {cat.type}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => openEdit(cat)}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(cat._id)}
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
              {editingId ? "Edit Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Groceries"
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
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

            <div className="space-y-2">
              <Label htmlFor="cat-icon">Icon (optional)</Label>
              <Input
                id="cat-icon"
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="e.g. ShoppingBag"
              />
              <p className="text-xs text-muted-foreground">
                Lucide icon name (e.g. Home, Car, Heart)
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
