import Link from "next/link";
import { LogoWordmark } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-7">
        <LogoWordmark size={30} />
      </Link>
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
