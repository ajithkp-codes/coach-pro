export default function ClientsLoading() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="skeleton h-7 w-28 rounded" />
          <div className="skeleton mt-1.5 h-4 w-64 rounded" />
        </div>
        <div className="skeleton h-10 w-28 rounded-[var(--radius)]" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {["Active", "Archived", "All"].map((t) => (
          <div key={t} className="skeleton h-8 w-20 rounded-[var(--radius)]" />
        ))}
      </div>

      {/* Client rows */}
      <div className="divide-y divide-border rounded-[var(--radius)] border border-border bg-card overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="skeleton h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton mt-1 h-3 w-48 rounded" />
            </div>
            <div className="skeleton hidden h-3 w-24 rounded sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
