import { resolveShare } from "@/lib/data/share-public";
import { Icon } from "@/components/ui/icon";
import { formatBytes, formatDate } from "@/lib/format";

export const metadata = { title: "Shared file · CoachPro" };

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const res = await resolveShare(token);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-primary text-sm font-bold text-primary-foreground">
          CP
        </div>
        <span className="text-lg font-semibold tracking-tight">CoachPro</span>
      </div>

      <div className="w-full max-w-md rounded-[var(--radius)] border border-border bg-card p-6 shadow-sm">
        {res.status === "ok" && res.file ? (
          <>
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-info-bg text-primary">
                <Icon name="file" size={22} />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold">
                  {res.file.title || res.file.original_name}
                </h1>
                <p className="truncate text-sm text-muted-foreground">
                  {res.file.original_name} · {formatBytes(res.file.size_bytes)}
                </p>
              </div>
            </div>

            {res.businessName && (
              <p className="mt-4 text-sm text-muted-foreground">
                Shared with you by{" "}
                <span className="font-medium text-foreground">
                  {res.businessName}
                </span>
                .
              </p>
            )}

            <a
              href={`/share/${token}/download`}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              <Icon name="download" size={18} /> Download file
            </a>

            {res.file.expires_at && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                This link expires on {formatDate(res.file.expires_at)}.
              </p>
            )}
          </>
        ) : (
          <div className="py-4 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-bg text-warning">
              <Icon name="alert" size={22} />
            </span>
            <h1 className="mt-4 text-base font-semibold">
              {res.status === "expired"
                ? "This link has expired"
                : res.status === "revoked"
                  ? "This link was turned off"
                  : "Link not found"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Please ask your trainer to share the file again.
            </p>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Powered by CoachPro
      </p>
    </div>
  );
}
