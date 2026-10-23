"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  badge?: number;
  match: (p: string) => boolean;
}

export function SidebarNav({
  name,
  businessName,
  isAdmin,
  suspendedCount = 0,
}: {
  name: string;
  businessName?: string | null;
  isAdmin?: boolean;
  suspendedCount?: number;
}) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "home", match: (p) => p === "/dashboard" },
    { href: "/clients", label: "Clients", icon: "users", match: (p) => p.startsWith("/clients") },
    { href: "/schedule", label: "Schedule", icon: "calendar", match: (p) => p.startsWith("/schedule") },
    { href: "/account", label: "Account", icon: "user", match: (p) => p.startsWith("/account") },
  ];
  if (isAdmin) {
    items.push({
      href: "/admin",
      label: "Admin",
      icon: "sparkles",
      badge: suspendedCount || undefined,
      match: (p) => p.startsWith("/admin"),
    });
  }

  return (
    <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-[220px] flex-col border-r border-border/50 sm:flex">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <LogoMark size={28} id="sidebar-logo" />
        <span className="text-base font-extrabold tracking-tight">
          Coach<span className="text-gradient">Pro</span>
        </span>
      </div>

      {/* Nav items */}
      <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <Icon name={item.icon} size={18} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
              {item.badge != null && item.badge > 0 && (
                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info at bottom */}
      <div className="border-t border-border/50 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            {businessName && (
              <p className="truncate text-xs text-muted-foreground">{businessName}</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
