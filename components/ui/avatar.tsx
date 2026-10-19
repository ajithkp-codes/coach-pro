import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const PALETTE = [
  { bg: "linear-gradient(135deg, #6d5cff20, #6d5cff08)", fg: "#6d5cff" },
  { bg: "linear-gradient(135deg, #00d4aa20, #00d4aa08)", fg: "#059669" },
  { bg: "linear-gradient(135deg, #0ea5e920, #0ea5e908)", fg: "#0284c7" },
  { bg: "linear-gradient(135deg, #f59e0b20, #f59e0b08)", fg: "#d97706" },
  { bg: "linear-gradient(135deg, #ef444420, #ef444408)", fg: "#dc2626" },
  { bg: "linear-gradient(135deg, #8b5cf620, #8b5cf608)", fg: "#7c3aed" },
  { bg: "linear-gradient(135deg, #ec489920, #ec489908)", fg: "#db2777" },
  { bg: "linear-gradient(135deg, #14b8a620, #14b8a608)", fg: "#0d9488" },
];

function colorFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

const sizes: Record<string, string> = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
};

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const c = colorFor(name);
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        sizes[size],
        className,
      )}
      style={{ background: c.bg, color: c.fg }}
    >
      {initials(name) || "?"}
    </div>
  );
}
