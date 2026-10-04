"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/**
 * Lightweight modal built on <dialog>. Controlled open/close via a trigger button.
 * Use for add/edit forms so the trainer stays in context.
 */
export function Modal({
  trigger,
  title,
  description,
  children,
  wide,
}: {
  trigger: (open: () => void) => React.ReactNode;
  title: string;
  description?: string;
  /** Render-prop body; `close` dismisses the modal (e.g. after a successful save). */
  children: (close: () => void) => React.ReactNode;
  wide?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  // Lock body scroll while open.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = React.useCallback(() => setOpen(false), []);

  return (
    <>
      {trigger(() => setOpen(true))}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            className={cn(
              "my-8 w-full rounded-[var(--radius)] border border-border bg-card shadow-xl",
              wide ? "max-w-2xl" : "max-w-md",
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {title}
                </h2>
                {description && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close"
                onClick={close}
              >
                ✕
              </Button>
            </div>
            <div className="px-5 py-5">{children(close)}</div>
          </div>
        </div>
      )}
    </>
  );
}
