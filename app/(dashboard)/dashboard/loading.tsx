export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Greeting skeleton */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton mt-2 h-8 w-56 rounded" />
        </div>
        <div className="skeleton h-10 w-28 rounded-[var(--radius)]" />
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

      {/* Client cards + sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-4 w-16 rounded" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-[var(--radius)] border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="skeleton h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-28 rounded" />
                    <div className="skeleton mt-1 h-3 w-16 rounded" />
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="skeleton h-3 w-12 rounded" />
                    <div className="skeleton mt-1 h-6 w-16 rounded" />
                  </div>
                  <div className="skeleton h-8 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="rounded-[var(--radius)] border border-border bg-card p-5">
            <div className="skeleton h-5 w-24 rounded" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-10 w-full rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
