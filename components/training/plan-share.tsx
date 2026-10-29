"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/ui/copy-button";
import {
  enablePlanShareAction,
  setPlanShareRevokedAction,
} from "@/app/(dashboard)/clients/[id]/training/plan-actions";
import type { WorkoutPlan } from "@/lib/types";

/**
 * Trainer dialog to create / copy / turn off a plan's public share link. The
 * link is read-only for the client and needs no login.
 */
export function PlanShare({ clientId, plan }: { clientId: string; plan: WorkoutPlan }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(plan.share_token);
  const [revoked, setRevoked] = useState<boolean>(plan.share_revoked);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = Boolean(token) && !revoked;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = token ? `${origin}/plan/${token}` : "";

  async function enable() {
    setBusy(true);
    setError(null);
    const res = await enablePlanShareAction(clientId, plan.id);
    setBusy(false);
    if (res.ok && res.token) {
      setToken(res.token);
      setRevoked(false);
      router.refresh();
    } else {
      setError(res.error ?? "Something went wrong.");
    }
  }

  async function turnOff() {
    setBusy(true);
    setError(null);
    await setPlanShareRevokedAction(clientId, plan.id, true);
    setBusy(false);
    setRevoked(true);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {active ? (
        <>
          <p className="text-sm text-muted-foreground">
            Anyone with this link can view <span className="font-medium text-foreground">{plan.name}</span> — the days,
            exercises, sets and reps. It&apos;s read-only and needs no login.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="flex-1" />
            <div className="flex gap-2">
              <CopyButton text={url} label="Copy link" />
              <Button variant="outline" size="sm" onClick={() => window.open(url, "_blank")}>
                <Icon name="link" size={15} /> Open
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">
              Turning it off stops the link working immediately. You can turn it back on anytime.
            </p>
            <Button variant="ghost" size="sm" onClick={turnOff} disabled={busy}>
              {busy ? "…" : "Turn off link"}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Create a read-only link to <span className="font-medium text-foreground">{plan.name}</span> that you can send
            your client over WhatsApp, email or anywhere. No login needed to view it.
          </p>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button onClick={enable} disabled={busy} className="self-start">
            <Icon name="link" size={15} /> {busy ? "Creating…" : revoked ? "Turn link back on" : "Create share link"}
          </Button>
        </>
      )}
    </div>
  );
}
