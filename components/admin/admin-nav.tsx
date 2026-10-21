"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminNav({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/admin", label: "Overview", exact: true, badge: 0 },
    { href: "/admin/analytics", label: "Analytics", exact: false, badge: 0 },
    { href: "/admin/revenue", label: "Revenue", exact: false, badge: 0 },
    { href: "/admin/funnel", label: "Funnel", exact: false, badge: 0 },
    { href: "/admin/trainers", label: "Trainers", exact: false, badge: pendingCount },
  ];

  return (
    <div className="-mb-px flex gap-1 border-b border-border">
      {tabs.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.badge > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {t.badge > 9 ? "9+" : t.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
