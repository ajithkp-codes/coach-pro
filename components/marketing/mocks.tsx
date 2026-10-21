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
   PHONE APP MOCK — light-editorial roster, sized for the phone frame.
   Fluid width (fills the phone screen), mirrors the real light product
   so the floating mock glows against the cinematic dark hero.
   ================================================================ */
function PhoneCrow({
  initials,
  name,
  sub,
  weight,
  delta,
  down = true,
  adherence,
}: {
  initials: string;
  name: string;
  sub: string;
  weight: string;
  delta: string;
  down?: boolean;
  adherence: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#e0dacf] bg-white px-3 py-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fce8e3] text-[11px] font-bold text-[#bc3420]">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[#1a1713]">{name}</p>
        <p className="truncate text-[11px] text-[#716a5e]">{sub}</p>
      </div>
      <div className="text-right">
        <p className="text-[13px] font-bold tabular text-[#1a1713]">{weight}</p>
        <p className={`text-[10px] font-semibold tabular ${down ? "text-[#0a7570]" : "text-[#b3281a]"}`}>
          {delta}
        </p>
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center">
        <svg width="34" height="34" viewBox="0 0 34 34" className="-rotate-90">
          <circle cx="17" cy="17" r="14" fill="none" stroke="#efebe3" strokeWidth="4" />
          <circle
            cx="17" cy="17" r="14" fill="none"
            stroke={adherence >= 70 ? "#0e8a84" : "#c0790f"}
            strokeWidth="4" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 14}
            strokeDashoffset={2 * Math.PI * 14 * (1 - adherence / 100)}
          />
        </svg>
      </div>
    </div>
  );
}

export function MockPhoneApp({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-4 bg-[#f5f3ef] px-4 pb-6 pt-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#716a5e]">
            Tue · 20 Oct
          </p>
          <p
            className="mt-0.5 text-[22px] leading-none text-[#1a1713]"
            style={{ fontFamily: "var(--font-serif)", fontWeight: 500, letterSpacing: "-0.02em" }}
          >
            Hey,{" "}
            <span style={{ fontStyle: "italic", color: "#bc3420" }}>Rahul</span>
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8402a] text-[#160a07]">
          <Icon name="plus" size={16} />
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#e0dacf] bg-white p-3">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#716a5e]">Active</p>
          <p className="mt-1 text-2xl font-bold tabular text-[#1a1713]">6</p>
        </div>
        <div className="rounded-xl border border-[#e0dacf] bg-white p-3">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-[#716a5e]">On track</p>
          <p className="mt-1 text-2xl font-bold tabular text-[#0a7570]">4</p>
        </div>
      </div>

      {/* Roster */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[12px] font-semibold text-[#1a1713]">Your clients</p>
          <span className="text-[11px] font-semibold text-[#bc3420]">View all →</span>
        </div>
        <div className="flex flex-col gap-2">
          <PhoneCrow initials="VS" name="Vikram Singh" sub="43 · M" weight="88.0" delta="−0.8" adherence={82} />
          <PhoneCrow initials="AI" name="Ananya Iyer" sub="28 · F" weight="58.0" delta="−1.2" adherence={64} />
          <PhoneCrow initials="AS" name="Aarav Sharma" sub="36 · M" weight="79.3" delta="−0.9" adherence={91} />
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   WEB APP MOCK — light-editorial desktop dashboard (1200px wide).
   Wrap in ProductScreenshot to scale into a BrowserFrame. CoachPro is
   a web app, so this is the hero's product shot.
   ================================================================ */
/* Shared editorial sidebar — mirrors the real SidebarNav (Dashboard / Clients
   / Account; no Reports item). `active` picks the highlighted row. */
function EditorialSidebar({ active }: { active: "Dashboard" | "Clients" | "Account" }) {
  const nav: { icon: IconName; label: typeof active }[] = [
    { icon: "home", label: "Dashboard" },
    { icon: "users", label: "Clients" },
    { icon: "user", label: "Account" },
  ];
  return (
    <div className="flex w-[220px] shrink-0 flex-col border-r border-[#e0dacf] bg-white/70">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
          <path d="M30.37 37.22 A13.6 13.6 0 1 1 33.28 18.90 C37.78 16.90 39.28 11.90 43.50 5.50" fill="none" stroke="#e8402a" strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[16px] font-extrabold tracking-tight text-[#1a1713]">
          Coach<span style={{ background: "linear-gradient(90deg,#e8402a,#ff8a66)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Pro</span>
        </span>
      </div>
      <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
        {nav.map((item) => {
          const on = item.label === active;
          return (
            <div
              key={item.label}
              className={`relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-medium ${
                on ? "bg-[#fce8e3] text-[#bc3420]" : "text-[#716a5e]"
              }`}
            >
              {on && <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#e8402a]" />}
              <Icon name={item.icon} size={18} strokeWidth={on ? 2.2 : 1.8} />
              {item.label}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-[#e0dacf] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fce8e3] text-[13px] font-bold text-[#bc3420]">RK</div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[#1a1713]">Rahul Kapoor</p>
            <p className="truncate text-[11px] text-[#716a5e]">Peak Fitness Studio</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Minimal top bar — mirrors the real sticky header (theme toggle + Sign out). */
function EditorialTopbar() {
  return (
    <div className="flex items-center justify-end gap-2 border-b border-[#e0dacf]/60 bg-[#f5f3ef]/80 px-6 py-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[#716a5e]">
        <Icon name="sun" size={16} />
      </span>
      <span className="rounded-[10px] px-3 py-1.5 text-[13px] font-medium text-[#716a5e]">Sign out</span>
    </div>
  );
}

/* Dashboard client card — mirrors the real ClientCard. */
function DashClientCard({
  initials, name, meta, weight, delta, good, spark, goals, session, warn,
}: {
  initials: string; name: string; meta: string; weight: string;
  delta?: string; good?: boolean; spark: number[]; goals: number;
  session: string; warn?: boolean;
}) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-[14px] border border-[#e0dacf] bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fce8e3] text-[12px] font-bold text-[#bc3420]">{initials}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-[#1a1713]">{name}</p>
          <p className="text-[12px] text-[#716a5e]">{meta}</p>
        </div>
        <Icon name="chevronRight" size={16} className="text-[#8f887a]" />
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#716a5e]">Weight</p>
          <p className="mt-0.5 text-[26px] font-bold tracking-tight text-[#1a1713]">{weight}</p>
          {delta && (
            <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${good ? "bg-[#def1ef] text-[#0a7570]" : "bg-[#f8efdd] text-[#8a5208]"}`}>
              <Icon name={good ? "trendingDown" : "trendingUp"} size={11} /> {delta}
            </span>
          )}
        </div>
        {spark.length >= 2 && <Sparkline data={spark} width={84} height={34} color="#e8402a" />}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-[#e0dacf]/70 pt-3 text-xs">
        {goals > 0 ? (
          <span className="rounded-full bg-[#fce8e3] px-2.5 py-0.5 text-[11px] font-semibold text-[#bc3420]">
            {goals} goal{goals === 1 ? "" : "s"}
          </span>
        ) : (
          <span className="text-[#716a5e]">No goals</span>
        )}
        <span className={`ml-auto font-medium ${warn ? "text-[#8a5208]" : "text-[#716a5e]"}`}>{session}</span>
      </div>
    </div>
  );
}

/* Dashboard donut / sessions-bar / rings widgets — mirror the real widgets. */
function DashDonut() {
  const value = 42, size = 100, sw = 10, r = (size - sw) / 2, circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-5 rounded-[14px] border border-[#e0dacf] bg-white p-5">
      <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e0dacf" strokeWidth={sw} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8402a" strokeWidth={sw} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ - (value / 100) * circ} />
        </svg>
        <span className="absolute text-[20px] font-black text-[#1a1713]">{value}%</span>
      </div>
      <div>
        <p className="text-[13px] font-semibold text-[#716a5e]">Goal completion</p>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#def1ef] text-[#0a7570]"><Icon name="check" size={12} /></span>
            <span className="font-semibold text-[#1a1713]">3</span><span className="text-[#716a5e]">achieved</span>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#fce8e3] text-[#e8402a]"><Icon name="target" size={12} /></span>
            <span className="font-semibold text-[#1a1713]">5</span><span className="text-[#716a5e]">active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashSessions() {
  const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
  const bars = [2, 3, 1, 4, 0, 0, 0];
  const todayIdx = 3, maxBar = 4;
  return (
    <div className="rounded-[14px] border border-[#e0dacf] bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[#2f6df0]" style={{ background: "rgba(47,109,240,0.12)" }}><Icon name="dumbbell" size={16} /></span>
          <span className="text-[13px] font-semibold text-[#716a5e]">Weekly sessions</span>
        </div>
        <span className="text-[22px] font-black text-[#1a1713]">5</span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-1.5" style={{ height: 64 }}>
        {bars.map((h, i) => {
          const isToday = i === todayIdx, isPast = i <= todayIdx;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className={`w-full rounded-t-sm ${isToday ? "bg-[#e8402a]" : isPast ? "bg-[#e8402a]/40" : "bg-[#e0dacf]/60"}`} style={{ height: `${Math.max((h / maxBar) * 100, 8)}%` }} />
              <span className={`text-[10px] font-medium ${isToday ? "font-bold text-[#e8402a]" : "text-[#716a5e]"}`}>{DAYS[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DashRing({ value, max, label, icon, accent }: { value: number; max: number; label: string; icon: IconName; accent: string }) {
  const size = 52, sw = 5, r = (size - sw) / 2, circ = 2 * Math.PI * r, pct = Math.min(value / max, 1);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e0dacf" strokeWidth={sw} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={accent} strokeWidth={sw} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ - pct * circ} />
        </svg>
        <span className="absolute" style={{ color: accent }}><Icon name={icon} size={16} /></span>
      </div>
      <div className="text-center">
        <p className="text-[18px] font-black text-[#1a1713]">{value}</p>
        <p className="text-[11px] text-[#716a5e]">{label}</p>
      </div>
    </div>
  );
}

export function MockWebApp({ className = "" }: { className?: string }) {
  return (
    <div className={`flex w-[1200px] overflow-hidden bg-[#f5f3ef] text-[#1a1713] ${className}`}>
      <EditorialSidebar active="Dashboard" />
      <div className="flex-1">
        <EditorialTopbar />
        <div className="p-8">
          {/* Header */}
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#716a5e]">Tuesday, 20 October</p>
              <p className="mt-1 text-[40px] leading-none" style={{ fontFamily: "var(--font-serif)", fontWeight: 500, letterSpacing: "-0.02em" }}>
                Hey, <span style={{ fontStyle: "italic", color: "#bc3420" }}>Rahul</span>
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-[10px] bg-[#e8402a] px-4 py-2.5 text-[14px] font-bold text-[#160a07]">
              <Icon name="plus" size={16} /> Add client
            </div>
          </div>

          {/* Widget row */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <DashDonut />
            <DashSessions />
            <div className="rounded-[14px] border border-[#e0dacf] bg-white p-5">
              <p className="mb-4 text-[13px] font-semibold text-[#716a5e]">Overview</p>
              <div className="flex items-start justify-around">
                <DashRing value={6} max={10} label="Clients" icon="users" accent="#e8402a" />
                <DashRing value={3} max={5} label="Achieved" icon="checkCircle" accent="#0e8a84" />
                <DashRing value={2} max={5} label="Alerts" icon="alert" accent="#c0790f" />
              </div>
            </div>
          </div>

          {/* Main grid */}
          <div className="mt-6 grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[14px] font-semibold">Your clients</p>
                <span className="text-[13px] font-medium text-[#e8402a]">View all →</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <DashClientCard initials="VS" name="Vikram Singh" meta="43 yrs · M" weight="88.0 kg" delta="0.8 kg" good spark={[92, 91, 90, 89.5, 89, 88]} goals={1} session="Trained 2d ago" />
                <DashClientCard initials="AS" name="Aarav Sharma" meta="36 yrs · M" weight="79.3 kg" delta="0.9 kg" good spark={[84, 83, 82, 81, 80, 79.3]} goals={2} session="Trained 1d ago" />
                <DashClientCard initials="AI" name="Ananya Iyer" meta="28 yrs · F" weight="58.0 kg" delta="1.2 kg" good spark={[64, 62, 61, 60, 59, 58]} goals={1} session="No training in 10d" warn />
                <DashClientCard initials="SR" name="Sneha Reddy" meta="34 yrs · F" weight="59.5 kg" delta="0.3 kg" good spark={[62, 61.5, 61, 60.5, 60, 59.5]} goals={1} session="No sessions yet" />
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {/* Reminders */}
              <div className="rounded-[14px] border border-[#e0dacf] bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-semibold">Reminders</p>
                  <span className="flex items-center gap-1 rounded-[10px] bg-[#fce8e3] px-2.5 py-1 text-[11px] font-semibold text-[#bc3420]"><Icon name="plus" size={12} /> Add</span>
                </div>
                <div className="mt-3 flex items-start gap-2.5 rounded-[10px] bg-[#efebe3]/60 px-3 py-2.5">
                  <div className="mt-0.5 h-4 w-4 rounded-full border-2 border-[#c7c0b2]" />
                  <div className="flex-1">
                    <p className="text-[12px] font-medium text-[#1a1713]">Post this week&apos;s client check-ins</p>
                    <span className="mt-1 inline-block rounded-full bg-[#f8efdd] px-2 py-0.5 text-[10px] font-bold text-[#8a5208]">Overdue · 12 Oct</span>
                  </div>
                </div>
              </div>

              {/* Needs attention */}
              <div className="rounded-[14px] border border-[#e0dacf] bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-semibold">Needs attention</p>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f8efdd] px-1.5 text-[10px] font-bold text-[#8a5208]">2</span>
                </div>
                <ul className="mt-3 space-y-2.5">
                  {[
                    { name: "Vikram Singh", issue: "Blood pressure out of range" },
                    { name: "Sneha Reddy", issue: "Vitamin D out of range" },
                  ].map((a, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 text-[#c0790f]"><Icon name="alert" size={14} /></span>
                      <div>
                        <p className="text-[12px] font-medium text-[#1a1713]">{a.name}</p>
                        <p className="text-[11px] text-[#716a5e]">{a.issue}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recent activity */}
              <div className="rounded-[14px] border border-[#e0dacf] bg-white p-5">
                <p className="text-[14px] font-semibold">Recent activity</p>
                <ul className="mt-3 space-y-3">
                  {[
                    { name: "Aarav Sharma", icon: "scale" as IconName, label: "Updated body metrics", time: "2d ago" },
                    { name: "Vikram Singh", icon: "pulse" as IconName, label: "Recorded blood pressure", time: "3d ago" },
                    { name: "Ananya Iyer", icon: "dumbbell" as IconName, label: "Logged a training session", time: "5d ago" },
                  ].map((a, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fce8e3] text-[9px] font-bold text-[#bc3420]">
                        {a.name.split(" ").map((w) => w[0]).join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-medium text-[#1a1713]">{a.name}</p>
                        <p className="flex items-center gap-1 text-[11px] text-[#716a5e]"><Icon name={a.icon} size={11} /> {a.label}</p>
                      </div>
                      <span className="text-[11px] text-[#8f887a]">{a.time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   CLIENT OVERVIEW MOCK — the real single-client page (1200px wide).
   A different product surface from the dashboard: one client's record
   with insight pills, stat tiles, goals, health markers and training —
   mirrors app/(dashboard)/clients/[id]. Wrap in ProductScreenshot.
   ================================================================ */
function OverviewStatTile({
  label, icon, value, unit, delta, good, accent, accentBg, spark,
}: {
  label: string; icon: IconName; value: string; unit: string;
  delta: string; good: boolean; accent: string; accentBg: string; spark: number[];
}) {
  return (
    <div className="rounded-[14px] border border-[#e0dacf] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#716a5e]">{label}</p>
        <span className="flex h-7 w-7 items-center justify-center rounded-[10px]" style={{ background: accentBg, color: accent }}>
          <Icon name={icon} size={15} />
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-[26px] font-bold tracking-tight text-[#1a1713]">{value}</span>
        <span className="text-[13px] font-medium text-[#716a5e]">{unit}</span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 text-[12px] font-semibold ${good ? "text-[#0a7570]" : "text-[#8a5208]"}`}>
          <Icon name={good ? "trendingDown" : "trendingUp"} size={12} /> {delta}
        </span>
        <Sparkline data={spark} width={72} height={28} color={accent} />
      </div>
    </div>
  );
}

export function MockClientReport({ className = "" }: { className?: string }) {
  const tabs = ["Overview", "Progress", "Training", "Share"];
  const insights = [
    { label: "Down 4.7 kg since April", tone: "pos" as const },
    { label: "Trained 2 days ago", tone: "neutral" as const },
    { label: "Blood pressure needs a check", tone: "warn" as const },
  ];
  const goals = [
    { title: "Reach 85 kg", pct: 72, now: "88.0 → 85.0 kg" },
    { title: "Fasting glucose under 95", pct: 60, now: "99 → 95 mg/dL" },
  ];
  const markers = [
    { name: "Total cholesterol", value: "188 mg/dL", ok: true },
    { name: "Blood pressure", value: "138 / 88 mmHg", ok: false },
    { name: "Vitamin D", value: "41 ng/mL", ok: true },
    { name: "HbA1c", value: "5.6 %", ok: true },
  ];
  const training = [
    { title: "Lower body strength", date: "19 Oct", sets: "18 sets", volume: "4,250 kg" },
    { title: "Push + core", date: "16 Oct", sets: "15 sets", volume: "3,100 kg" },
    { title: "Conditioning", date: "14 Oct", sets: "9 sets", volume: "1,480 kg" },
  ];
  return (
    <div className={`flex w-[1200px] overflow-hidden bg-[#f5f3ef] text-[#1a1713] ${className}`}>
      <EditorialSidebar active="Clients" />
      <div className="flex-1">
        <EditorialTopbar />
        <div className="p-8">
          <p className="text-[13px] font-medium text-[#716a5e]">← All clients</p>

          {/* Client header */}
          <div className="mt-3 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fce8e3] text-[18px] font-bold text-[#bc3420]">VS</div>
              <div>
                <div className="flex items-center gap-2.5">
                  <p className="text-[22px] font-semibold tracking-tight">Vikram Singh</p>
                  <span className="rounded-full bg-[#def1ef] px-2.5 py-0.5 text-[11px] font-semibold text-[#0a7570]">Active</span>
                </div>
                <p className="mt-1 text-[13px] text-[#716a5e]">43 yrs · +91 98765 43210 · vikram@example.in · Consent 12 Mar 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-[10px] border border-[#e0dacf] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#1a1713]"><Icon name="user" size={14} /> Edit</span>
              <span className="flex items-center gap-1.5 rounded-[10px] border border-[#e0dacf] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#1a1713]"><Icon name="download" size={14} /> Export</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex items-center gap-7 border-b border-[#e0dacf]">
            {tabs.map((t, i) => (
              <span
                key={t}
                className={`-mb-px border-b-2 pb-3 text-[14px] font-semibold ${
                  i === 0 ? "border-[#e8402a] text-[#1a1713]" : "border-transparent text-[#8f887a]"
                }`}
              >
                {t}
              </span>
            ))}
          </div>

          {/* Insight pills + copy summary */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {insights.map((p) => (
              <span
                key={p.label}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                  p.tone === "pos" ? "bg-[#def1ef] text-[#0a7570]" : p.tone === "warn" ? "bg-[#f8efdd] text-[#8a5208]" : "bg-[#efebe3] text-[#57514a]"
                }`}
              >
                <Icon name={p.tone === "pos" ? "trendingUp" : p.tone === "warn" ? "alert" : "sparkles"} size={12} />
                {p.label}
              </span>
            ))}
            <span className="ml-auto flex items-center gap-1.5 rounded-[10px] border border-[#e0dacf] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#57514a]">
              <Icon name="link" size={13} /> Copy summary
            </span>
          </div>

          {/* Stat tiles */}
          <div className="mt-5 grid grid-cols-4 gap-4">
            <OverviewStatTile label="Weight" icon="scale" value="88.0" unit="kg" delta="0.8 kg" good accent="#e8402a" accentBg="#fce8e3" spark={[92, 91, 90, 89.5, 89, 88]} />
            <OverviewStatTile label="Body fat" icon="pulse" value="22.4" unit="%" delta="1.1 %" good accent="#0369a1" accentBg="rgba(3,105,161,0.12)" spark={[26, 25, 24.5, 23.8, 23, 22.4]} />
            <OverviewStatTile label="Waist" icon="ruler" value="94" unit="cm" delta="3 cm" good accent="#c2410c" accentBg="rgba(194,65,12,0.12)" spark={[101, 100, 98, 97, 95, 94]} />
            <OverviewStatTile label="Training" icon="dumbbell" value="12" unit="sessions" delta="4 wk" good={false} accent="#0e8a84" accentBg="#def1ef" spark={[1, 2, 2, 3, 2, 2]} />
          </div>

          {/* Active goals */}
          <div className="mt-6 rounded-[14px] border border-[#e0dacf] bg-white p-6">
            <p className="text-[14px] font-semibold">Active goals</p>
            <div className="mt-4 grid grid-cols-2 gap-6">
              {goals.map((g) => (
                <div key={g.title}>
                  <div className="mb-1.5 flex items-center justify-between text-[13px]">
                    <span className="font-semibold text-[#1a1713]">{g.title}</span>
                    <span className="text-[#716a5e]">{g.now}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#efebe3]">
                      <div className="h-full rounded-full bg-[#e8402a]" style={{ width: `${g.pct}%` }} />
                    </div>
                    <span className="text-[12px] font-bold tabular text-[#716a5e]">{g.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Markers + training */}
          <div className="mt-6 grid grid-cols-2 gap-6">
            <div className="rounded-[14px] border border-[#e0dacf] bg-white p-6">
              <p className="text-[14px] font-semibold">Latest health markers</p>
              <ul className="mt-3 flex flex-col">
                {markers.map((m, i) => (
                  <li key={m.name} className={`flex items-center justify-between py-2.5 text-[13px] ${i < markers.length - 1 ? "border-b border-[#e0dacf]/70" : ""}`}>
                    <span className="text-[#57514a]">{m.name}</span>
                    <span className="flex items-center gap-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.ok ? "bg-[#def1ef] text-[#0a7570]" : "bg-[#f8efdd] text-[#8a5208]"}`}>
                        {m.ok ? "In range" : "Out of range"}
                      </span>
                      <span className="font-bold tabular text-[#1a1713]">{m.value}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[14px] border border-[#e0dacf] bg-white p-6">
              <p className="text-[14px] font-semibold">Recent training</p>
              <ul className="mt-3 flex flex-col">
                {training.map((t, i) => (
                  <li key={t.title} className={`flex items-center justify-between py-2.5 ${i < training.length - 1 ? "border-b border-[#e0dacf]/70" : ""}`}>
                    <div>
                      <p className="text-[13px] font-semibold text-[#1a1713]">{t.title}</p>
                      <p className="text-[11px] text-[#716a5e]">{t.date} · {t.sets}</p>
                    </div>
                    <span className="rounded-full bg-[#efebe3] px-2.5 py-0.5 text-[11px] font-semibold text-[#57514a]">{t.volume}</span>
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
