import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const PALETTE = [
  { bg: "linear-gradient(135deg, #0e8a8420, #0e8a8408)", fg: "#0a7570" },
  { bg: "linear-gradient(135deg, #2f6df020, #2f6df008)", fg: "#1d5fd6" },
  { bg: "linear-gradient(135deg, #c0790f20, #c0790f08)", fg: "#8a5208" },
  { bg: "linear-gradient(135deg, #7c3aed20, #7c3aed08)", fg: "#6d28d9" },
  { bg: "linear-gradient(135deg, #0d948820, #0d948808)", fg: "#0f766e" },
  { bg: "linear-gradient(135deg, #be2d1b20, #be2d1b08)", fg: "#be2d1b" },
  { bg: "linear-gradient(135deg, #0284c720, #0284c708)", fg: "#0369a1" },
  { bg: "linear-gradient(135deg, #db277720, #db277708)", fg: "#be185d" },
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
