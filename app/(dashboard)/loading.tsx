export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius)] border border-border bg-card p-5">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton mt-3 h-6 w-16 rounded" />
            <div className="skeleton mt-2 h-3 w-32 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
