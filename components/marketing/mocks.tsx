import { Icon, type IconName } from "@/components/ui/icon";
import { Sparkline } from "@/components/charts/sparkline";

/* ================================================================
   Product UI mockups for the landing page.
   These render at a fixed large width (1200px) and are CSS-scaled
   down to fit their container, so they look like real full-size
   product screenshots — no squished text or broken layouts.
   ================================================================ */

/* ---- Sidebar ---- */
function MockSidebar() {
  const items: { icon: IconName; label: string; active?: boolean }[] = [
    { icon: "home", label: "Dashboard", active: true },
    { icon: "users", label: "Clients" },
    { icon: "user", label: "Account" },
  ];
  return (
    <div className="flex w-[200px] shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#ff6a43] to-[#ff8a66]">
          <svg width="14" height="14" viewBox="0 0 40 40" fill="none">
            <path d="M4 22 L10 22 L14 10 L20 32 L26 16 L30 22 L36 22" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-sm font-extrabold text-white">
          Coach<span className="bg-gradient-to-r from-[#ff6a43] to-[#ff8a66] bg-clip-text text-transparent">Pro</span>
        </span>
      </div>
      <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium ${
              item.active
                ? "bg-[#ff6a43]/10 text-[#ff6a43]"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {item.active && (
              <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#ff6a43]" />
            )}
            <Icon name={item.icon} size={17} />
            {item.label}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/[0.06] px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6a43]/20 to-[#ff8a66]/10 text-[10px] font-bold text-white/70">
            RK
          </div>
          <div>
            <p className="text-[12px] font-semibold text-white/90">Rahul Kapoor</p>
            <p className="text-[10px] text-white/40">Peak Fitness Studio</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Donut chart ---- */
function MockDonut({ value, size = 90 }: { value: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#ff6a43" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="drop-shadow-[0_0_8px_rgba(255,106,67,0.5)]"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-black text-white">{value}%</span>
      </div>
    </div>
  );
}

/* ---- Ring progress (small) ---- */
function RingProgress({ value, color = "#ff8a66", size = 44 }: { value: number; color?: string; size?: number }) {
  const r = (size - 5) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
    </svg>
  );
}

/* ---- Bar chart ---- */
function MockBarChart() {
  const bars = [
    { label: "M", h: 40 },
    { label: "T", h: 70 },
    { label: "W", h: 55 },
    { label: "T", h: 90 },
    { label: "F", h: 60 },
    { label: "S", h: 30 },
    { label: "S", h: 15 },
  ];
  return (
    <div className="flex items-end gap-2" style={{ height: 60 }}>
      {bars.map((b, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div
            className={`w-3 rounded-t-sm ${i === 3 ? "bg-[#ff8a66]" : i < 5 ? "bg-[#ff6a43]/60" : "bg-white/[0.06]"}`}
            style={{ height: `${b.h * 0.6}px` }}
          />
          <span className={`text-[9px] ${i === 3 ? "font-bold text-[#ff8a66]" : "text-white/30"}`}>{b.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ---- Stat tile (mirrors real product) ---- */
function MockStatTile({
  icon,
  label,
  value,
  sub,
  accentBg,
  accentText,
}: {
  icon: IconName;
  label: string;
  value: string | number;
  sub: string;
  accentBg: string;
  accentText: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accentBg} ${accentText}`}>
          <Icon name={icon} size={16} />
        </span>
        <span className="text-[13px] font-medium text-white/50">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-[12px] text-white/40">{sub}</p>
    </div>
  );
}

/* ---- Client card (mirrors real product) ---- */
function MockClientCard({
  initials,
  name,
  age,
  sex,
  weight,
  delta,
  spark,
  goals,
  session,
  sessionWarn,
}: {
  initials: string;
  name: string;
  age: string;
  sex: string;
  weight: string;
  delta: string;
  spark: number[];
  goals: number;
  session: string;
  sessionWarn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6a43]/20 to-[#ff8a66]/10 text-[11px] font-bold text-white/70">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-white">{name}</p>
          <p className="text-[12px] text-white/40">{age} · {sex}</p>
        </div>
        <Icon name="chevronRight" size={16} className="text-white/20" />
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Weight</p>
          <p className="mt-1 text-2xl font-bold text-white">{weight}</p>
          <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            delta.startsWith("+") ? "bg-[#f59e0b]/10 text-[#fbbf24]" : "bg-[#10b981]/10 text-[#34d399]"
          }`}>
            <Icon name={delta.startsWith("+") ? "trendingUp" : "trendingDown"} size={11} />
            {delta} kg
          </span>
        </div>
        {spark.length >= 2 && <Sparkline data={spark} width={80} height={32} color="#ff6a43" />}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/[0.04] pt-3 text-[12px]">
        <span className="rounded-full bg-[#ff6a43]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#ff6a43]">
          {goals} goal{goals !== 1 ? "s" : ""}
        </span>
        <span className={`font-medium ${sessionWarn ? "text-[#fbbf24]" : "text-white/40"}`}>
          {session}
        </span>
      </div>
    </div>
  );
}

/* ================================================================
   MAIN DASHBOARD MOCK — full-size layout (1200px wide)
   Wrap in ProductScreenshot to scale it down on the landing page.
   ================================================================ */
export function MockDashboard({ className = "" }: { className?: string }) {
  return (
    <div className={`flex w-[1200px] overflow-hidden bg-[#1c1915] text-white ${className}`}>
      <MockSidebar />

      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[13px] font-medium text-white/40">Tuesday, 20 October</p>
            <h1 className="mt-1 text-2xl font-bold">
              Hey, <span className="bg-gradient-to-r from-[#ff6a43] to-[#ff8a66] bg-clip-text text-transparent">Rahul</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6a43] to-[#ff6a43]/80 px-4 py-2 text-[13px] font-semibold text-white">
            <Icon name="plus" size={15} /> Add client
          </div>
        </div>

        {/* Stat tiles row */}
        <div className="mt-5 grid grid-cols-4 gap-4">
          <MockStatTile icon="users" label="Active clients" value={6} sub="Your roster" accentBg="bg-[#ff6a43]/10" accentText="text-[#ff6a43]" />
          <MockStatTile icon="dumbbell" label="Sessions this week" value={5} sub="Across all clients" accentBg="bg-[#0ea5e9]/10" accentText="text-[#38bdf8]" />
          <MockStatTile icon="checkCircle" label="Goals achieved" value={1} sub="All time" accentBg="bg-[#10b981]/10" accentText="text-[#34d399]" />
          <MockStatTile icon="alert" label="Needs attention" value={4} sub="See the list" accentBg="bg-[#f59e0b]/10" accentText="text-[#fbbf24]" />
        </div>

        {/* Main content grid */}
        <div className="mt-6 grid grid-cols-3 gap-6">
          {/* Client cards column (2 cols) */}
          <div className="col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-white">Your clients</h2>
              <span className="text-[13px] font-medium text-[#ff6a43]">View all →</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <MockClientCard initials="VS" name="Vikram Singh" age="43 yrs" sex="M" weight="88 kg" delta="-0.8" spark={[92, 91, 90, 89.5, 89, 88]} goals={1} session="Trained 5d ago" />
              <MockClientCard initials="AS" name="Aarav Sharma" age="36 yrs" sex="M" weight="79.3 kg" delta="-0.9" spark={[84, 83, 82, 81, 80, 79.3]} goals={2} session="Trained 5d ago" />
              <MockClientCard initials="AI" name="Ananya Iyer" age="28 yrs" sex="F" weight="58 kg" delta="-1.2" spark={[64, 62, 61, 60, 59, 58]} goals={1} session="No training in 10d" sessionWarn />
              <MockClientCard initials="SR" name="Sneha Reddy" age="34 yrs" sex="F" weight="59.5 kg" delta="-0.3" spark={[62, 61.5, 61, 60.5, 60, 59.5]} goals={1} session="No sessions yet" />
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Reminders */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-white">Reminders</h3>
                <span className="flex items-center gap-1 rounded-lg bg-[#ff6a43]/10 px-2.5 py-1 text-[11px] font-semibold text-[#ff6a43]">
                  <Icon name="plus" size={12} /> Add
                </span>
              </div>
              <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-white/[0.02] px-3 py-2.5">
                <div className="mt-0.5 h-4 w-4 rounded-full border-2 border-white/20" />
                <div className="flex-1">
                  <p className="text-[12px] font-medium text-white/80">Post this week&apos;s client check-ins</p>
                  <span className="mt-1 inline-block rounded-full bg-[#f59e0b]/10 px-2 py-0.5 text-[10px] font-bold text-[#fbbf24]">
                    Overdue · 12 Oct 2026
                  </span>
                </div>
              </div>
            </div>

            {/* Needs attention */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-white">Needs attention</h3>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f59e0b]/15 px-1.5 text-[10px] font-bold text-[#fbbf24]">4</span>
              </div>
              <ul className="mt-3 space-y-2.5">
                {[
                  { name: "Vikram Singh", issue: "Blood pressure (diastolic) out of range" },
                  { name: "Vikram Singh", issue: "Blood pressure (systolic) out of range" },
                  { name: "Sneha Reddy", issue: "Vitamin D (25-OH) out of range" },
                  { name: "Priya Nair", issue: "Fasting blood sugar out of range" },
                ].map((a, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#f59e0b]"><Icon name="alert" size={14} /></span>
                    <div>
                      <p className="text-[12px] font-medium text-white/80">{a.name}</p>
                      <p className="text-[11px] text-white/40">{a.issue}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recent activity */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h3 className="text-[14px] font-semibold text-white">Recent activity</h3>
              <ul className="mt-3 space-y-3">
                {[
                  { name: "Aarav Sharma", icon: "scale" as IconName, label: "Updated body metrics", time: "2d ago" },
                  { name: "Vikram Singh", icon: "pulse" as IconName, label: "Recorded Blood pressure", time: "3d ago" },
                  { name: "Ananya Iyer", icon: "dumbbell" as IconName, label: "Logged a training session", time: "5d ago" },
                ].map((a, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6a43]/15 to-[#ff8a66]/5 text-[9px] font-bold text-white/60">
                      {a.name.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-white/80">{a.name}</p>
                      <p className="flex items-center gap-1 text-[11px] text-white/35">
                        <Icon name={a.icon} size={11} /> {a.label}
                      </p>
                    </div>
                    <span className="text-[11px] text-white/30">{a.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   CHART MOCK — weight trend (used standalone in feature section)
   ================================================================ */
export function MockChart({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-[#1c1915] p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6a43]/20 to-[#ff8a66]/10 text-[#ff6a43]">
            <Icon name="scale" size={15} />
          </span>
          <span className="text-sm font-bold text-white">Weight trend</span>
        </div>
        <span className="rounded-lg bg-[#ff8a66]/10 px-3 py-1 text-[11px] font-bold text-[#ff8a66]">
          -4.7 kg
        </span>
      </div>
      <svg viewBox="0 0 320 120" className="mt-5 h-32 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mcArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff6a43" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ff6a43" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="mcLine" x1="0" y1="0" x2="320" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff6a43" />
            <stop offset="100%" stopColor="#ff8a66" />
          </linearGradient>
        </defs>
        {[30, 60, 90].map((y) => (
          <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        ))}
        <path d="M0,20 C40,25 50,35 80,38 C110,41 130,48 160,55 C190,62 210,70 240,78 C270,86 290,90 320,95 L320,120 L0,120 Z" fill="url(#mcArea)" />
        <path d="M0,20 C40,25 50,35 80,38 C110,41 130,48 160,55 C190,62 210,70 240,78 C270,86 290,90 320,95" fill="none" stroke="url(#mcLine)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="320" cy="95" r="4" fill="#1c1915" stroke="#ff8a66" strokeWidth="2.5" className="animate-pulse" />
        <circle cx="0" cy="20" r="3" fill="#1c1915" stroke="#ff6a43" strokeWidth="2" />
      </svg>
      <div className="mt-3 flex justify-between text-[10px] text-white/40">
        <span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span>
      </div>
    </div>
  );
}

/* ================================================================
   GOALS MOCK
   ================================================================ */
export function MockGoals({ className = "" }: { className?: string }) {
  const goals = [
    { title: "Reach 77 kg", pct: 68, now: "79.3 kg" },
    { title: "Fasting glucose < 95", pct: 83, now: "99 mg/dL" },
  ];
  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-[#1c1915] p-4 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-bold text-white">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff6a43]/15 text-[#ff6a43]">
          <Icon name="target" size={14} />
        </span>
        Active goals
      </div>
      <ul className="mt-3 flex flex-col gap-3">
        {goals.map((g) => (
          <li key={g.title} className="flex items-center gap-3">
            <RingProgress value={g.pct} color={g.pct > 75 ? "#ff8a66" : "#ff6a43"} size={36} />
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-semibold text-white/70">{g.title}</span>
                <span className="text-white/50">{g.now}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#ff6a43] to-[#ff8a66]" style={{ width: `${g.pct}%` }} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ================================================================
   HEALTH MARKERS MOCK
   ================================================================ */
export function MockMarkers({ className = "" }: { className?: string }) {
  const rows = [
    { name: "Total cholesterol", value: "188 mg/dL", tone: "ok" as const },
    { name: "Blood pressure", value: "138 mmHg", tone: "warn" as const },
    { name: "Vitamin D", value: "41 ng/mL", tone: "ok" as const },
  ];
  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-[#1c1915] p-4 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-bold text-white">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff8a66]/10 text-[#ff8a66]">
          <Icon name="pulse" size={14} />
        </span>
        Health markers
      </div>
      <ul className="mt-3 flex flex-col gap-2.5 text-xs">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2.5">
            <span className="text-white/60">{r.name}</span>
            <span className="flex items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${r.tone === "ok" ? "bg-[#10b981]/10 text-[#34d399]" : "bg-[#f59e0b]/10 text-[#fbbf24]"}`}>
                {r.tone === "ok" ? "In range" : "Watch"}
              </span>
              <span className="font-bold text-white/80">{r.value}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ================================================================
   PROGRESS PHOTOS MOCK
   ================================================================ */
export function MockPhotos({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-[#1c1915] p-4 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-bold text-white">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff6a43]/15 text-[#ff6a43]">
          <Icon name="camera" size={14} />
        </span>
        Progress photos
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { label: "Front", week: "Wk 1", bg: "from-[#1a1530] to-[#0d0a1a]", color: "#ff6a43" },
          { label: "Side", week: "Wk 4", bg: "from-[#152030] to-[#0a0f1a]", color: "#ff8a66" },
          { label: "Back", week: "Wk 8", bg: "from-[#0d1a2a] to-[#080d18]", color: "#ff8a66" },
        ].map((view) => (
          <div key={view.label} className={`relative aspect-[3/4] overflow-hidden rounded-xl bg-gradient-to-b ${view.bg}`}>
            <svg viewBox="0 0 80 120" className="absolute inset-0 h-full w-full" fill="none">
              <circle cx="40" cy="22" r="10" fill={view.color} opacity="0.4" />
              <rect x="30" y="32" width="20" height="30" rx="4" fill={view.color} opacity="0.3" />
              <rect x="24" y="34" width="8" height="22" rx="3" fill={view.color} opacity="0.25" />
              <rect x="48" y="34" width="8" height="22" rx="3" fill={view.color} opacity="0.25" />
              <rect x="31" y="62" width="8" height="30" rx="3" fill={view.color} opacity="0.25" />
              <rect x="41" y="62" width="8" height="30" rx="3" fill={view.color} opacity="0.25" />
            </svg>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-2 pb-2 pt-6">
              <span className="text-[9px] font-bold text-white/60">{view.label}</span>
              <span className="text-[9px] font-bold text-white/80">{view.week}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   NOTIFICATION MOCK
   ================================================================ */
export function MockNotification({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#1c1915] px-4 py-3 ${className}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f59e0b]/10 text-[#fbbf24]">
        <Icon name="alert" size={16} />
      </span>
      <div>
        <p className="text-xs font-bold text-white/80">2 clients need attention</p>
        <p className="text-[11px] text-white/50">Missed check-in this week</p>
      </div>
    </div>
  );
}
