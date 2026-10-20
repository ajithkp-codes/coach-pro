"use client";

import { useEffect, useRef, useState } from "react";

export function CountUp({
  target,
  suffix = "",
  prefix = "",
  duration = 2000,
  className,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started || !ref.current) return;
    const el = ref.current;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = `${prefix}${Math.round(target * ease).toLocaleString("en-IN")}${suffix}`;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, target, suffix, prefix, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}

export function Marquee({
  children,
  speed = 30,
  className,
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  return (
    <div className={`marquee-wrap overflow-hidden ${className ?? ""}`}>
      <div
        className="animate-marquee flex w-max gap-8"
        style={{ "--marquee-speed": `${speed}s` } as React.CSSProperties}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
