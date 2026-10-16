"use client";

import { ButtonLink, Button, DeleteButton } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function ClientActions({
  editHref,
  exportHref,
  archiveLabel,
  archiveAction,
  deleteAction,
  clientName,
}: {
  editHref: string;
  exportHref: string;
  archiveLabel: string;
  archiveAction: () => Promise<void>;
  deleteAction: () => Promise<void>;
  clientName: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ButtonLink href={editHref} variant="outline" size="sm">
        Edit
      </ButtonLink>
      <a
        href={exportHref}
        className="inline-flex h-8 items-center rounded-[var(--radius)] border border-input bg-card px-3 text-sm font-medium hover:bg-muted"
      >
        Export
      </a>
      <form action={archiveAction}>
        <Button type="submit" variant="outline" size="sm">
          {archiveLabel}
        </Button>
      </form>
      <Modal
        title={`Delete ${clientName}?`}
        description="This permanently removes the client and all their metrics, markers, and goals. This cannot be undone."
        trigger={(open) => (
          <Button variant="danger" size="sm" onClick={open}>
            Delete
          </Button>
        )}
      >
        {(close) => (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Consider <strong>Export</strong> first if you need a copy of this
              data for the client&apos;s records.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={close}>
                Cancel
              </Button>
              <form action={deleteAction}>
                <DeleteButton label="Delete permanently" />
              </form>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
