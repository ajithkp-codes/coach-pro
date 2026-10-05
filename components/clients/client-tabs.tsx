"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ClientTabs({ clientId }: { clientId: string }) {
  const pathname = usePathname();
  const base = `/clients/${clientId}`;
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/metrics`, label: "Body metrics" },
    { href: `${base}/markers`, label: "Health markers" },
    { href: `${base}/goals`, label: "Goals" },
    { href: `${base}/training`, label: "Training" },
    { href: `${base}/photos`, label: "Photos" },
    { href: `${base}/files`, label: "Files" },
    { href: `${base}/charts`, label: "Charts" },
  ];

  return (
    <div className="-mb-px flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((t) => {
        const active =
          t.href === base ? pathname === base : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
