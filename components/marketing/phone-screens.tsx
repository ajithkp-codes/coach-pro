import { Icon } from "@/components/ui/icon";

/**
 * Compact app screens designed to fit inside PhoneFrame.
 * These look like actual app screenshots — dense, realistic data,
 * proper nav patterns, status indicators.
 */

export function ScreenDashboard() {
  return (
    <div className="px-4 pt-2">
      {/* App header */}
      <div className="flex items-center justify-between py-3">
        <div>
          <p className="text-[10px] text-white/40">Good morning</p>
          <p className="text-sm font-bold text-white">Rahul Kapoor</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#ff6a43] to-[#ff8a66]" />
      </div>

      {/* Stats row */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <StatMini icon="users" label="Clients" value="24" color="#ff6a43" />
        <StatMini icon="dumbbell" label="Sessions" value="18" color="#ff8a66" />
      </div>

      {/* Client list */}
      <div className="mt-3 rounded-xl bg-white/[0.04] p-3">
        <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-white/30">Active clients</p>
        <ClientMini name="Aarav S." goal="Half-marathon" weight="79.3 kg" delta="-4.7" color="#ff8a66" />
        <ClientMini name="Priya N." goal="Fat loss" weight="63.8 kg" delta="-4.2" color="#ff8a66" />
        <ClientMini name="Ananya I." goal="Marathon" weight="58.0 kg" delta="-6.0" color="#ff6a43" />
        <ClientMini name="Vikram R." goal="Muscle gain" weight="82.1 kg" delta="+3.4" color="#ff6a43" />
        <ClientMini name="Meera K." goal="PCOS mgmt" weight="71.5 kg" delta="-2.8" color="#ff8a66" />
      </div>

      {/* Bottom nav hint */}
      <div className="mt-3 flex justify-around py-2 text-white/20">
        <Icon name="layout" size={18} />
        <Icon name="users" size={18} />
        <Icon name="trendingUp" size={18} />
        <Icon name="settings" size={18} />
      </div>
    </div>
  );
}

export function ScreenClientDetail() {
  return (
    <div className="px-4 pt-2">
      {/* Header */}
      <div className="flex items-center gap-2 py-3">
        <Icon name="chevronLeft" size={16} className="text-white/40" />
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6a43]/30 to-[#ff8a66]/10 text-xs font-bold text-white/70">
            AS
          </div>
          <div>
            <p className="text-sm font-bold text-white">Aarav Sharma</p>
            <p className="text-[10px] text-white/40">34 · Half-marathon prep</p>
          </div>
        </div>
      </div>

      {/* Insight strip */}
      <div className="rounded-lg bg-[#ff8a66]/10 px-3 py-2 text-[10px]">
        <span className="font-bold text-[#ff8a66]">On track</span>
        <span className="text-white/50"> · Lost 4.7 kg in 12 weeks · Next: 77 kg target</span>
      </div>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <StatTiny label="Weight" value="79.3 kg" />
        <StatTiny label="Body fat" value="18.2%" />
        <StatTiny label="Waist" value="84 cm" />
      </div>

      {/* Mini chart */}
      <div className="mt-3 rounded-xl bg-white/[0.04] p-3">
        <p className="text-[10px] font-bold text-white/50">Weight trend</p>
        <svg viewBox="0 0 200 60" className="mt-2 h-14 w-full">
          <defs>
            <linearGradient id="sc-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6a43" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ff6a43" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="sc-line" x1="0" y1="0" x2="200" y2="0">
              <stop offset="0%" stopColor="#ff6a43" />
              <stop offset="100%" stopColor="#ff8a66" />
            </linearGradient>
          </defs>
          <path d="M0 8 L33 14 L66 22 L100 30 L133 38 L166 44 L200 50 L200 60 L0 60Z" fill="url(#sc-area)" />
          <path d="M0 8 L33 14 L66 22 L100 30 L133 38 L166 44 L200 50" stroke="url(#sc-line)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="200" cy="50" r="3" fill="#ff8a66" />
        </svg>
        <div className="mt-1 flex justify-between text-[8px] text-white/25">
          <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span>
        </div>
      </div>

      {/* Goals */}
      <div className="mt-3 rounded-xl bg-white/[0.04] p-3">
        <p className="text-[10px] font-bold text-white/50">Goals</p>
        <GoalMini title="Reach 77 kg" pct={68} />
        <GoalMini title="Glucose < 95" pct={83} />
      </div>
    </div>
  );
}

export function ScreenMetrics() {
  return (
    <div className="px-4 pt-2">
      <div className="flex items-center gap-2 py-3">
        <Icon name="chevronLeft" size={16} className="text-white/40" />
        <p className="text-sm font-bold text-white">Health Markers</p>
      </div>

      {/* Markers list */}
      <div className="space-y-2">
        <MarkerRow name="Fasting glucose" value="99 mg/dL" tone="warn" range="70–100" />
        <MarkerRow name="Total cholesterol" value="188 mg/dL" tone="ok" range="< 200" />
        <MarkerRow name="Blood pressure" value="138/85" tone="warn" range="< 130/85" />
        <MarkerRow name="Vitamin D" value="41 ng/mL" tone="ok" range="30–100" />
        <MarkerRow name="HbA1c" value="5.4%" tone="ok" range="< 5.7%" />
        <MarkerRow name="HDL" value="52 mg/dL" tone="ok" range="> 40" />
        <MarkerRow name="Triglycerides" value="148 mg/dL" tone="warn" range="< 150" />
      </div>

      {/* Add button */}
      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-1.5 rounded-full bg-[#ff6a43] px-4 py-2 text-[10px] font-bold text-white">
          <Icon name="plus" size={12} /> Add marker
        </div>
      </div>
    </div>
  );
}

/* ---- Helper components ---- */

function StatMini({ icon, label, value, color }: { icon: "users" | "dumbbell"; label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg bg-white/[0.04] p-2.5">
      <div className="flex items-center gap-1 text-[9px] text-white/40">
        <Icon name={icon} size={10} />
        {label}
      </div>
      <p className="mt-1 text-lg font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

function StatTiny({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.04] p-2 text-center">
      <p className="text-[8px] text-white/30">{label}</p>
      <p className="mt-0.5 text-[11px] font-bold text-white">{value}</p>
    </div>
  );
}

function ClientMini({ name, goal, weight, delta, color }: { name: string; goal: string; weight: string; delta: string; color: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.04] py-2 last:border-0">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-[8px] font-bold text-white/50">
          {name.split(" ").map(w => w[0]).join("")}
        </div>
        <div>
          <p className="text-[11px] font-semibold text-white/90">{name}</p>
          <p className="text-[9px] text-white/30">{goal}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-bold text-white/80">{weight}</p>
        <p className="text-[9px] font-bold" style={{ color }}>{delta}</p>
      </div>
    </div>
  );
}

function GoalMini({ title, pct }: { title: string; pct: number }) {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-white/60">{title}</span>
        <span className="font-bold text-white/80">{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-gradient-to-r from-[#ff6a43] to-[#ff8a66]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MarkerRow({ name, value, tone, range }: { name: string; value: string; tone: "ok" | "warn"; range: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2.5">
      <div>
        <p className="text-[11px] font-semibold text-white/80">{name}</p>
        <p className="text-[9px] text-white/30">Range: {range}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${
          tone === "ok" ? "bg-[#10b981]/15 text-[#34d399]" : "bg-[#f59e0b]/15 text-[#fbbf24]"
        }`}>
          {tone === "ok" ? "OK" : "Watch"}
        </span>
        <span className="text-[11px] font-bold text-white/90">{value}</span>
      </div>
    </div>
  );
}
