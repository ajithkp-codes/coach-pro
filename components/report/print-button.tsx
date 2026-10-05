"use client";

import { Icon } from "@/components/ui/icon";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-border bg-card px-3 text-sm font-medium shadow-sm hover:bg-muted"
    >
      <Icon name="download" size={16} /> Save as PDF
    </button>
  );
}
