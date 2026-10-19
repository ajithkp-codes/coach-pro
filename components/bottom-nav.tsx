"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function BottomNav({ isAdmin, pendingCount = 0 }: { isAdmin?: boolean; pendingCount?: number }) {
  const pathname = usePathname();

  const items: { href: string; label: string; icon: IconName; badge?: number; match: (p: string) => boolean }[] = [
    { href: "/dashboard", label: "Home", icon: "home", match: (p) => p === "/dashboard" },
    { href: "/clients", label: "Clients", icon: "users", match: (p) => p.startsWith("/clients") },
    { href: "/account", label: "Account", icon: "user", match: (p) => p.startsWith("/account") },
  ];
  if (isAdmin) {
    items.push({ href: "/admin", label: "Admin", icon: "sparkles", badge: pendingCount || undefined, match: (p) => p.startsWith("/admin") });
  }

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map((it) => {
          const active = it.match(pathname);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-all duration-200",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="relative">
                {active && (
                  <span className="absolute -inset-1.5 rounded-full bg-primary-glow" />
                )}
                <Icon name={it.icon} size={21} strokeWidth={active ? 2.2 : 1.8} className="relative" />
                {it.badge && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white shadow-sm">
                    {it.badge > 9 ? "9+" : it.badge}
                  </span>
                )}
              </span>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
