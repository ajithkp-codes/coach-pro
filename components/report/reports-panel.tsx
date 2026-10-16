"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, DeleteButton } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import {
  createReportAction,
  setReportRevokedAction,
  deleteReportAction,
  type ReportState,
} from "@/app/(dashboard)/clients/[id]/report/actions";
import type { ProgressReport } from "@/lib/types";

const PERIOD_LABEL: Record<string, string> = {
  "3m": "Last 3 months",
  "6m": "Last 6 months",
  "12m": "Last 12 months",
  all: "All time",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating…" : "Create report link"}
    </Button>
  );
}

function ReportForm({
  clientId,
  onSuccess,
  onCancel,
}: {
  clientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [state, action] = useActionState<ReportState, FormData>(
    createReportAction.bind(null, clientId),
    {},
  );
  useEffect(() => {
    if (state.ok) onSuccess();
  }, [state.ok, onSuccess]);

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field label="Title" htmlFor="title" hint="Shown on the report. Defaults to 'Progress Report'.">
        <Input id="title" name="title" placeholder="e.g. Q1 progress" />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Period" htmlFor="period">
          <Select id="period" name="period" defaultValue="6m">
            <option value="3m">Last 3 months</option>
            <option value="6m">Last 6 months</option>
            <option value="12m">Last 12 months</option>
            <option value="all">All time</option>
          </Select>
        </Field>
        <Field label="Link expires" htmlFor="expires_in_days">
          <Select id="expires_in_days" name="expires_in_days" defaultValue="30">
            <option value="7">In 7 days</option>
            <option value="30">In 30 days</option>
            <option value="90">In 90 days</option>
            <option value="never">Never</option>
          </Select>
        </Field>
      </div>
      <label className="flex items-center gap-3 rounded-[var(--radius)] border border-border bg-muted/50 p-3 text-sm">
        <input type="checkbox" name="include_photos" value="true" defaultChecked className="h-4 w-4 accent-[var(--color-primary)]" />
        Include progress photos in the report
      </label>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <SubmitButton />
      </div>
    </form>
  );
}

function CopyLink({ token, disabled }: { token: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/r/${token}`);
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

function statusOf(r: ProgressReport): { label: string; tone: "success" | "warning" | "neutral" } {
  if (r.revoked) return { label: "Off", tone: "neutral" };
  if (r.expires_at && new Date(r.expires_at) < new Date()) return { label: "Expired", tone: "warning" };
  return { label: "Live", tone: "success" };
}

export function ReportsPanel({
  clientId,
  reports,
}: {
  clientId: string;
  reports: ProgressReport[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Generate a branded progress report your client can open from a link. No
          account needed on their side.
        </p>
        <Modal
          title="Create progress report"
          description="Pick a period and get a shareable link."
          trigger={(open) => (
            <Button onClick={open}>
              <Icon name="plus" size={16} /> New report
            </Button>
          )}
        >
          {(close) => (
            <ReportForm
              clientId={clientId}
              onCancel={close}
              onSuccess={() => {
                close();
                location.reload();
              }}
            />
          )}
        </Modal>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          title="No reports yet"
          description="Create a progress report to share this client's results over a link."
        />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {reports.map((r) => {
            const st = statusOf(r);
            const live = st.label === "Live";
            return (
              <div key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info-bg text-primary">
                  <Icon name="sparkles" size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.title || "Progress Report"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {PERIOD_LABEL[r.period]} · {r.view_count} view{r.view_count === 1 ? "" : "s"}
                    {r.expires_at && <> · expires {formatDate(r.expires_at)}</>}
                  </p>
                </div>
                <Badge tone={st.tone}>{st.label}</Badge>
                <div className="flex items-center gap-1">
                  <a
                    href={`/r/${r.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center rounded-[var(--radius)] px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Open
                  </a>
                  <CopyLink token={r.token} disabled={!live} />
                  <form action={setReportRevokedAction.bind(null, clientId, r.id, !r.revoked)}>
                    <Button type="submit" variant="ghost" size="sm">
                      {r.revoked ? "Turn on" : "Turn off"}
                    </Button>
                  </form>
                  <Modal
                    title="Delete report?"
                    description="This permanently removes the report and its link."
                    trigger={(open) => (
                      <Button variant="ghost" size="sm" onClick={open}>Delete</Button>
                    )}
                  >
                    {(close) => (
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={close}>Cancel</Button>
                        <form action={deleteReportAction.bind(null, clientId, r.id)}>
                          <DeleteButton />
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
