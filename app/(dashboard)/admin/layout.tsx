import { requireAdmin } from "@/lib/data/admin";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin(); // gate: redirects non-admins to /dashboard

  return (
    <div>
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
          <span className="rounded-full bg-info-bg px-2.5 py-0.5 text-xs font-medium text-primary">
            Platform
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform overview and trainer management. No client health data is shown here.
        </p>
      </div>
      <AdminNav />
      <div className="py-6">{children}</div>
    </div>
  );
}
