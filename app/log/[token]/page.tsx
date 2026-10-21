import { resolveLogToken } from "@/lib/data/client-log-public";
import { ClientDietLogger } from "@/components/nutrition/client-diet-logger";
import { Icon } from "@/components/ui/icon";
import { submitClientLogAction } from "./actions";

export const metadata = { title: "Log my food · CoachPro" };

export default async function ClientLogPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const res = await resolveLogToken(token);

  if (res.status !== "ok") {
    return (
      <Shell>
        <div className="py-4 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-bg text-warning">
            <Icon name="alert" size={22} />
          </span>
          <h1 className="mt-4 text-base font-semibold">This logging link isn&apos;t active</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Please ask your trainer for an up-to-date link.
          </p>
        </div>
      </Shell>
    );
  }

  const action = submitClientLogAction.bind(null, token);

  return (
    <Shell>
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight">
          Hi {res.clientName?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Log what you ate and send it to {res.businessName ?? "your trainer"}.
        </p>
      </div>
      <ClientDietLogger
        action={action}
        businessName={res.businessName ?? null}
        plan={res.plan ?? null}
        draft={res.todaySubmission ?? null}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-primary text-sm font-bold text-primary-foreground">
            CP
          </div>
          <span className="text-lg font-semibold tracking-tight">CoachPro</span>
        </div>
        {children}
      </div>
    </div>
  );
}
