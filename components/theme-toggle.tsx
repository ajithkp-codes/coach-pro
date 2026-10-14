"use client";

import { useTheme, type Theme } from "@/components/theme-provider";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const ORDER: Theme[] = ["light", "dark", "system"];
const ICON: Record<Theme, IconName> = { light: "sun", dark: "moon", system: "monitor" };
const LABEL: Record<Theme, string> = { light: "Light", dark: "Dark", system: "System" };

/** Compact cycling button: Light -> Dark -> System. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${LABEL[theme]}. Switch to ${LABEL[next]}`}
      title={`Theme: ${LABEL[theme]}`}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-input bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <Icon name={ICON[theme]} size={17} />
    </button>
  );
}

/** Full segmented control for the account page. */
export function ThemeSegmented() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="inline-flex gap-1 rounded-[var(--radius)] border border-border bg-muted/50 p-1">
      {ORDER.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTheme(t)}
          className={cn(
            "flex items-center gap-1.5 rounded-[calc(var(--radius)-2px)] px-3 py-1.5 text-sm font-medium transition-colors",
            theme === t
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon name={ICON[t]} size={15} />
          {LABEL[t]}
        </button>
      ))}
    </div>
  );
}
