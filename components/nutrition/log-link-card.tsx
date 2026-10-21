"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Icon } from "@/components/ui/icon";
import {
  enableClientLogAction,
  disableClientLogAction,
} from "@/app/(dashboard)/clients/[id]/nutrition/actions";

export function LogLinkCard({
  clientId,
  token,
}: {
  clientId: string;
  token: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOff, setConfirmOff] = useState(false);
  const [origin, setOrigin] = useState("");

  // The public URL is origin-relative; resolve it after mount (reading
  // window.location on the server would break hydration).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOrigin(window.location.origin), []);
  const url = token ? `${origin}/log/${token}` : "";

  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      await fn();
      setConfirmOff(false);
      router.refresh();
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client self-logging</CardTitle>
        <Icon name="link" size={16} className="text-muted-foreground" />
      </CardHeader>
      <CardBody>
        {token ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Share this private link with your client. What they log arrives here for you to review
              before it counts.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-[var(--radius)] border border-border bg-muted/40 px-3 py-2 text-xs">
                {url || "…"}
              </code>
              {url && <CopyButton text={url} label="Copy link" />}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => run(() => enableClientLogAction(clientId))}
              >
                <Icon name="clock" size={14} /> Rotate link
              </Button>
              {confirmOff ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  className="text-danger"
                  onClick={() => run(() => disableClientLogAction(clientId))}
                >
                  Confirm turn off
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setConfirmOff(true)}>
                  Turn off
                </Button>
              )}
            </div>
            {confirmOff && (
              <p className="text-xs text-muted-foreground">
                Turning it off (or rotating) makes the current link stop working immediately.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Let this client log their own meals from a private link — no account needed. You review
              each day before it&apos;s added to their log.
            </p>
            <Button
              size="sm"
              className="self-start"
              disabled={pending}
              onClick={() => run(() => enableClientLogAction(clientId))}
            >
              <Icon name="link" size={15} /> Create logging link
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
