import { requireAdmin, getPendingCount } from "@/lib/data/admin";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin(); // gate: redirects non-admins to /dashboard
  const pendingCount = await getPendingCount().catch(() => 0);

  return (
    <div>
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
          <span className="rounded-full bg-info-bg px-2.5 py-0.5 text-xs font-medium text-primary">
            Platform
          </span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-danger px-2.5 py-0.5 text-xs font-bold text-white">
              {pendingCount} pending
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform overview and trainer management. No client health data is shown here.
        </p>
      </div>
      <AdminNav pendingCount={pendingCount} />
      <div className="py-6">{children}</div>
    </div>
  );
}
