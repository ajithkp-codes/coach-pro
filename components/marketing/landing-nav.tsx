"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo";

/**
 * Scroll-aware landing nav. Transparent with paper-light text while it floats
 * over the cinematic dark hero; switches to a solid paper bar with ink text
 * once the hero scrolls past.
 */
export function LandingNav({ signedIn }: { signedIn: boolean }) {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed left-0 right-0 top-0 z-40">
      <div
        className={`transition-colors duration-300 ${
          solid
            ? "border-b border-[#e0dacf] bg-[#f5f3ef]/90 backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark size={30} tone={solid ? "brand" : "paper"} />
            <span
              className={`text-[15px] font-extrabold tracking-tight transition-colors ${
                solid ? "text-[#1a1713]" : "text-[#faf7f2]"
              }`}
            >
              CoachPro
            </span>
          </Link>
          <nav
            className={`hidden items-center gap-8 text-sm transition-colors sm:flex ${
              solid ? "text-[#1a1713]/55" : "text-[#faf7f2]/70"
            }`}
          >
            {[
              ["#product", "Product"],
              ["#features", "Features"],
              ["#pricing", "Pricing"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className={`transition-colors ${solid ? "hover:text-[#1a1713]" : "hover:text-[#faf7f2]"}`}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {signedIn ? (
              <ButtonLink href="/dashboard" size="sm">
                Open dashboard
              </ButtonLink>
            ) : (
              <>
                <ButtonLink
                  href="/login"
                  variant="ghost"
                  size="sm"
                  className={
                    solid
                      ? "text-[#1a1713]/60 hover:bg-[#1a1713]/5 hover:text-[#1a1713]"
                      : "text-[#faf7f2]/75 hover:bg-white/10 hover:text-[#faf7f2]"
                  }
                >
                  Sign in
                </ButtonLink>
                <ButtonLink href="/signup" size="sm">
                  Start free
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
