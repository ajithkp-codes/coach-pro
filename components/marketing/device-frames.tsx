/**
 * Device mockup frames for marketing — phone and browser.
 * These wrap product UI inside realistic device bezels with
 * reflections, glows, and perspective transforms.
 */

export function PhoneFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className ?? ""}`}>
      {/* Phone bezel */}
      <div className="relative rounded-[2.5rem] border-[6px] border-[#1a1a2e] bg-[#1a1a2e] shadow-[0_8px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)]">
        {/* Top notch / dynamic island */}
        <div className="absolute left-1/2 top-2 z-20 flex -translate-x-1/2 items-center gap-2">
          <div className="h-[22px] w-[90px] rounded-full bg-[#0a0a0f]" />
        </div>
        {/* Screen area */}
        <div className="relative overflow-hidden rounded-[2rem] bg-[#141210]">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pb-1 pt-3 text-[10px] font-semibold text-white/60">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor"><path d="M1 5.5h1.5v4H1zM4 3.5h1.5v6H4zM7 1.5h1.5v8H7zM10 0h1.5v10H10z" opacity=".7"/></svg>
              <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor"><path d="M7 0C4.2 0 1.7 1.2 0 3.1l1.3 1.3C2.6 2.6 4.7 1.6 7 1.6s4.4 1 5.7 2.8L14 3.1C12.3 1.2 9.8 0 7 0zM7 3.3c-1.7 0-3.3.7-4.4 1.9l1.3 1.3c.8-.8 1.9-1.3 3.1-1.3s2.3.5 3.1 1.3l1.3-1.3C10.3 4 8.7 3.3 7 3.3zM7 6.5c-.8 0-1.6.3-2.1.9L7 9.5l2.1-2.1C8.6 6.8 7.8 6.5 7 6.5z" opacity=".7"/></svg>
              <svg width="20" height="10" viewBox="0 0 20 10" fill="currentColor"><rect x="1" y="1" width="15" height="8" rx="1.5" stroke="currentColor" strokeWidth=".8" fill="none" opacity=".5"/><rect x="2.5" y="2.5" width="10" height="5" rx=".5" opacity=".7"/><rect x="17" y="3" width="2" height="4" rx="1" opacity=".3"/></svg>
            </div>
          </div>
          {/* Content */}
          <div className="min-h-[480px]">
            {children}
          </div>
          {/* Home indicator */}
          <div className="flex justify-center pb-2 pt-2">
            <div className="h-[4px] w-[100px] rounded-full bg-white/20" />
          </div>
        </div>
        {/* Reflection overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />
      </div>
    </div>
  );
}

export function BrowserFrame({
  children,
  url = "coachpro.co.in/dashboard",
  className,
}: {
  children: React.ReactNode;
  url?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <div className="overflow-hidden rounded-xl border border-[#1a1a2e] bg-[#0a0a0f] shadow-[0_8px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)]">
        {/* Browser chrome */}
        <div className="flex items-center gap-3 border-b border-[#1a1a2e] bg-[#0d0d1a] px-4 py-2.5">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          {/* URL bar */}
          <div className="flex flex-1 items-center gap-2 rounded-md bg-[#1a1a2e] px-3 py-1">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 text-white/30"><path d="M6 1a3.5 3.5 0 0 0-3.5 3.5c0 .74.23 1.43.62 2L6 11l2.88-4.5c.39-.57.62-1.26.62-2A3.5 3.5 0 0 0 6 1z" stroke="currentColor" strokeWidth="1"/></svg>
            <span className="truncate text-[11px] text-white/40">{url}</span>
          </div>
        </div>
        {/* Content */}
        <div className="bg-[#141210]">
          {children}
        </div>
        {/* Reflection */}
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-white/[0.04] via-transparent to-transparent" />
      </div>
    </div>
  );
}

export function PhoneShowcase({
  screens,
  className,
}: {
  screens: { content: React.ReactNode; label: string }[];
  className?: string;
}) {
  const angles = [-12, 0, 12];
  const zs = [1, 2, 1];
  const offsets = [-60, 0, 60];

  return (
    <div className={`relative flex items-center justify-center ${className ?? ""}`} style={{ perspective: "1200px" }}>
      {screens.slice(0, 3).map((screen, i) => (
        <div
          key={screen.label}
          className="absolute transition-transform duration-500"
          style={{
            transform: `translateX(${offsets[i]}%) rotateY(${angles[i]}deg)`,
            zIndex: zs[i],
          }}
        >
          <div className="w-[220px] sm:w-[260px]">
            <PhoneFrame>
              {screen.content}
            </PhoneFrame>
            <p className="mt-4 text-center text-xs font-semibold text-muted-foreground">{screen.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
