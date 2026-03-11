import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { TwoFactorSetup } from "~/components/settings/two-factor-setup";

export const Route = createFileRoute("/settings/security")({
  component: SecurityPage,
});

function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    toast.info("Password change not yet implemented");
    setSaving(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Security
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your password and authentication
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock size={16} />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saving || !currentPassword || !newPassword || !confirmPassword}
              >
                {saving ? "Updating..." : "Update password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <TwoFactorSetup />
    </div>
  );
}
