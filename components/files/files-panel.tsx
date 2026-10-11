"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/client";
import { SHARE_BUCKET } from "@/lib/constants";
import { formatBytes, formatDate } from "@/lib/format";
import {
  createSharedFileAction,
  setRevokedAction,
  deleteSharedFileAction,
} from "@/app/(dashboard)/clients/[id]/files/actions";
import type { SharedFile } from "@/lib/types";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

function extOf(name: string): string {
  const e = name.includes(".") ? name.split(".").pop() : "";
  return (e || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
}

function Uploader({
  clientId,
  onSuccess,
  onCancel,
}: {
  clientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [expiry, setExpiry] = useState("30");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return setError("Choose a file to share.");
    if (file.size > MAX_BYTES) return setError("File must be 25 MB or smaller.");

    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Your session expired. Please sign in again.");
        setBusy(false);
        return;
      }
      const path = `${user.id}/${clientId}/${crypto.randomUUID()}.${extOf(file.name)}`;
      const up = await supabase.storage
        .from(SHARE_BUCKET)
        .upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (up.error) {
        setError(`Upload failed: ${up.error.message}`);
        setBusy(false);
        return;
      }
      const fd = new FormData();
      fd.set("storage_path", path);
      fd.set("original_name", file.name);
      fd.set("content_type", file.type || "");
      fd.set("size_bytes", String(file.size));
      fd.set("title", title);
      fd.set("expires_in_days", expiry);
      const res = await createSharedFileAction(clientId, {}, fd);
      if (res.error) {
        await supabase.storage.from(SHARE_BUCKET).remove([path]);
        setError(res.error);
        setBusy(false);
        return;
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Field label="File" htmlFor="file" hint="PDF, image, or document · up to 25 MB" required>
        <input
          id="file"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm file:mr-3 file:rounded-[var(--radius)] file:border file:border-input file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />
      </Field>
      <Field label="Title" htmlFor="title" hint="Shown to the client. Defaults to the file name.">
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Week 8 training plan"
        />
      </Field>
      <Field label="Link expires" htmlFor="expiry">
        <Select id="expiry" value={expiry} onChange={(e) => setExpiry(e.target.value)}>
          <option value="7">In 7 days</option>
          <option value="30">In 30 days</option>
          <option value="90">In 90 days</option>
          <option value="never">Never</option>
        </Select>
      </Field>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="button" onClick={handleUpload} disabled={busy}>
          {busy ? "Uploading…" : "Create share link"}
        </Button>
      </div>
    </div>
  );
}

function CopyLink({ token, disabled }: { token: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      const url = `${window.location.origin}/share/${token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  }
  return (
    <Button variant="outline" size="sm" onClick={copy} disabled={disabled}>
      {copied ? "Copied!" : "Copy link"}
    </Button>
  );
}

function statusOf(f: SharedFile): { label: string; tone: "success" | "warning" | "neutral" } {
  if (f.revoked) return { label: "Revoked", tone: "neutral" };
  if (f.expires_at && new Date(f.expires_at) < new Date())
    return { label: "Expired", tone: "warning" };
  return { label: "Active", tone: "success" };
}

export function FilesPanel({
  clientId,
  files,
}: {
  clientId: string;
  files: SharedFile[];
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Share a workout plan or document via a private link. The client
          doesn&apos;t need an account.
        </p>
        <Modal
          title="Share a file"
          description="Upload a file and get a link you can send to your client."
          trigger={(open) => (
            <Button onClick={open}>
              <Icon name="plus" size={16} /> Share a file
            </Button>
          )}
        >
          {(close) => (
            <Uploader
              clientId={clientId}
              onCancel={close}
              onSuccess={() => {
                close();
                router.refresh();
              }}
            />
          )}
        </Modal>
      </div>

      {files.length === 0 ? (
        <EmptyState
          title="No shared files yet"
          description="Upload a workout plan or document to share it with this client."
        />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {files.map((f) => {
            const st = statusOf(f);
            const active = st.label === "Active";
            return (
              <div key={f.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info-bg text-primary">
                  <Icon name="file" size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {f.title || f.original_name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {f.original_name} · {formatBytes(f.size_bytes)} ·{" "}
                    {f.download_count} download{f.download_count === 1 ? "" : "s"}
                    {f.expires_at && (
                      <> · expires {formatDate(f.expires_at)}</>
                    )}
                  </p>
                </div>
                <Badge tone={st.tone}>{st.label}</Badge>
                <div className="flex items-center gap-1">
                  <CopyLink token={f.token} disabled={!active} />
                  <form action={setRevokedAction.bind(null, clientId, f.id, !f.revoked)}>
                    <Button type="submit" variant="ghost" size="sm">
                      {f.revoked ? "Restore" : "Revoke"}
                    </Button>
                  </form>
                  <Modal
                    title="Delete shared file?"
                    description="This removes the file and disables its link permanently."
                    trigger={(open) => (
                      <Button variant="ghost" size="sm" onClick={open}>
                        Delete
                      </Button>
                    )}
                  >
                    {(close) => (
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={close}>
                          Cancel
                        </Button>
                        <form action={deleteSharedFileAction.bind(null, clientId, f.id)}>
                          <Button type="submit" variant="danger">
                            Delete
                          </Button>
                        </form>
                      </div>
                    )}
                  </Modal>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
