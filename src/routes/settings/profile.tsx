import { createFileRoute } from "@tanstack/react-router";
import { api } from "convex/_generated/api.js";
import type { Id } from "convex/_generated/dataModel.js";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, Copy, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useCurrentUser } from "~/hooks/use-current-user";

export const Route = createFileRoute("/settings/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useCurrentUser();
  const household = useQuery(api.households.get);
  const members = useQuery(api.households.getMembers);
  const updateProfile = useMutation(api.users.updateProfile);
  const updateHousehold = useMutation(api.households.update);
  const createInvite = useMutation(api.households.createInvite);
  const removeMember = useMutation(api.households.removeMember);

  const userData = user as Record<string, unknown> | null;

  const [firstName, setFirstName] = useState(
    () => (userData?.firstName as string) ?? (userData?.name as string)?.split(" ")[0] ?? "",
  );
  const [lastName, setLastName] = useState(
    () => (userData?.lastName as string) ?? (userData?.name as string)?.split(" ").slice(1).join(" ") ?? "",
  );
  const [householdName, setHouseholdName] = useState(() => household?.name ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [householdSaving, setHouseholdSaving] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      await updateProfile({ firstName, lastName });
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleHouseholdSave = async () => {
    setHouseholdSaving(true);
    try {
      await updateHousehold({ name: householdName });
      toast.success("Household updated");
    } catch {
      toast.error("Failed to update household");
    } finally {
      setHouseholdSaving(false);
    }
  };

  const handleCreateInvite = async () => {
    try {
      const result = await createInvite({});
      setInviteCode(result.code);
      setInviteDialogOpen(true);
    } catch {
      toast.error("Failed to create invite");
    }
  };

  const handleRemoveMember = async (userId: Id<"users">) => {
    try {
      await removeMember({ userId });
      toast.success("Member removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Profile
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal information and household
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={(userData?.email as string) ?? ""}
              disabled
              className="opacity-60"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleProfileSave} disabled={profileSaving}>
              {profileSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Household</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="householdName">Household name</Label>
              <Input
                id="householdName"
                value={householdName || household?.name || ""}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="My Household"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleHouseholdSave} disabled={householdSaving} variant="outline">
                {householdSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-medium">Members</h4>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={handleCreateInvite}>
                <Plus size={14} />
                Add member
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members?.map((member) => (
                    <TableRow key={member.memberId}>
                      <TableCell className="font-medium">
                        {member.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.email ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={member.role === "admin" ? "default" : "secondary"}
                          className="capitalize"
                        >
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.userId !== user._id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveMember(member.userId)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <AlertTriangle size={16} />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Reset account</p>
              <p className="text-xs text-muted-foreground">
                Delete all transactions, accounts, and budgets
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10" disabled>
              Reset
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete account</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" size="sm" disabled>
              Delete account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Invite Code</DialogTitle>
            <DialogDescription>
              Share this code with a household member. It expires in 24 hours.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input
              value={inviteCode ?? ""}
              readOnly
              className="font-mono text-lg tracking-widest text-center"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (inviteCode) {
                  void navigator.clipboard.writeText(inviteCode);
                  toast.success("Copied to clipboard");
                }
              }}
            >
              <Copy size={16} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
