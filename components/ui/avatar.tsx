import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

// Pleasant, accessible avatar backgrounds (text stays readable on each).
const PALETTE = [
  { bg: "#eef2ff", fg: "#4338ca" },
  { bg: "#ecfeff", fg: "#0e7490" },
  { bg: "#f0fdf4", fg: "#15803d" },
  { bg: "#fef2f2", fg: "#b91c1c" },
  { bg: "#fff7ed", fg: "#c2410c" },
  { bg: "#faf5ff", fg: "#7e22ce" },
  { bg: "#fdf2f8", fg: "#be185d" },
  { bg: "#f0f9ff", fg: "#0369a1" },
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
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        sizes[size],
        className,
      )}
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {initials(name) || "?"}
    </div>
  );
}
