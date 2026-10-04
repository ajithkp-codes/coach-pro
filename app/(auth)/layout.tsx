import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-primary text-sm font-bold text-primary-foreground">
          CP
        </div>
        <span className="text-lg font-semibold tracking-tight">CoachPro</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Private workspace for personal trainers ·{" "}
        <Link href="/" className="underline hover:text-foreground">
          About
        </Link>
      </p>
    </div>
  );
}
