import { createFileRoute } from "@tanstack/react-router";
import { api } from "convex/_generated/api.js";
import { useMutation, useQuery } from "convex/react";
import { Activity, Check, Clock, Copy, Key, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { formatDate, formatRelativeDate } from "~/lib/utils";

export const Route = createFileRoute("/settings/api-key")({
  component: ApiKeyPage,
});

function ApiKeyPage() {
  const apiKey = useQuery(api.apiKeys.getApiKey);
  const activeTokens = useQuery(api.apiKeys.listActiveTokens);
  const auditLog = useQuery(api.apiKeys.getAuditLog);
  const generateApiKey = useMutation(api.apiKeys.generateApiKey);
  const revokeApiKey = useMutation(api.apiKeys.revokeApiKey);
  const revokeToken = useMutation(api.apiKeys.revokeToken);
  const revokeAllTokens = useMutation(api.apiKeys.revokeAllTokens);

  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateApiKey();
      setNewKey(result.key);
      setCopied(false);
      setConfirmRegenerate(false);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    if (!apiKey?._id) return;
    await revokeApiKey({ keyId: apiKey._id });
    setNewKey(null);
  };

  const handleRevokeAllTokens = async () => {
    await revokeAllTokens();
    setConfirmRevokeAll(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">API Key</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your API key for external automation tools
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">API Key</CardTitle>
              <CardDescription>
                Use this key to authenticate automation requests
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {newKey && (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
              <div className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-warning">
                    Copy your API key now — it will only be shown once
                  </p>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={newKey}
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-positive" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {apiKey ? (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
                    {apiKey.prefix}••••••••
                  </code>
                  <Badge variant="secondary">{apiKey.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Created {formatDate(new Date(apiKey.createdAt))}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmRegenerate(true)}
                >
                  Regenerate
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRevoke}
                >
                  Revoke
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Key className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mb-1 text-sm font-medium">No API key generated</p>
              <p className="mb-4 max-w-xs text-center text-xs text-muted-foreground">
                Generate a key to use with iPhone Shortcuts, Samsung Automation, n8n, or other tools.
              </p>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? "Generating..." : "Generate API Key"}
              </Button>
            </div>
          )}

          <div className="rounded-lg bg-muted/50 p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Usage</p>
            <div className="space-y-1.5 font-mono text-xs text-muted-foreground">
              <p className="text-foreground/80">
                1. <span className="text-primary">POST</span> /api/token{" "}
                <span className="text-muted-foreground">— exchange key for temp token</span>
              </p>
              <p className="text-foreground/80">
                2. <span className="text-primary">POST</span> /api/transactions{" "}
                <span className="text-muted-foreground">— create transaction with token</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <div>
                <CardTitle className="text-lg">Active Tokens</CardTitle>
                <CardDescription>
                  Temporary tokens issued from your API key
                </CardDescription>
              </div>
            </div>
            {activeTokens && activeTokens.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmRevokeAll(true)}
              >
                Revoke All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activeTokens === undefined ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : activeTokens.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No active tokens
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTokens.map((token) => (
                  <TableRow key={token._id}>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {token.source}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatRelativeDate(new Date(token.createdAt))}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {token.lastUsedAt
                        ? formatRelativeDate(new Date(token.lastUsedAt))
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatRelativeDate(new Date(token.expiresAt))}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => revokeToken({ tokenId: token._id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>
                API access log for the last 50 events
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {auditLog === undefined ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : auditLog.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No activity yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLog.map((entry) => (
                  <TableRow key={entry._id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(new Date(entry.timestamp), "MMM d, HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {entry.action}
                      </code>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {entry.endpoint}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={entry.success ? "default" : "destructive"}
                        className={
                          entry.success
                            ? "bg-positive/15 text-positive hover:bg-positive/20"
                            : ""
                        }
                      >
                        {entry.success ? "OK" : "Failed"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmRegenerate} onOpenChange={setConfirmRegenerate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Regenerate API Key?</DialogTitle>
            <DialogDescription>
              This will revoke your current key and all active tokens. Any
              integrations using the old key will stop working immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmRegenerate(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? "Regenerating..." : "Regenerate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmRevokeAll} onOpenChange={setConfirmRevokeAll}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Revoke All Tokens?</DialogTitle>
            <DialogDescription>
              All active tokens will be immediately invalidated. Automation
              tools will need to request new tokens.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmRevokeAll(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevokeAllTokens}>
              Revoke All
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
