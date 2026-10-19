export default function ClientDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Insight strip */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-7 w-36 rounded-full" />
        ))}
      </div>

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius)] border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <div className="skeleton h-7 w-7 rounded-lg" />
              <div className="skeleton h-3.5 w-20 rounded" />
            </div>
            <div className="skeleton mt-4 h-7 w-16 rounded" />
            <div className="skeleton mt-1.5 h-3 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Content cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius)] border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="skeleton h-5 w-36 rounded" />
              <div className="skeleton h-4 w-12 rounded" />
            </div>
            <div className="space-y-3 p-5">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-4 w-16 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
