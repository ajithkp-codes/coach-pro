"use client";

import { useRef, useState, useEffect } from "react";

export function ProductScreenshot({
  children,
  nativeWidth = 1200,
  className = "",
}: {
  children: React.ReactNode;
  nativeWidth?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const update = () => {
      const containerWidth = container.offsetWidth;
      const s = containerWidth / nativeWidth;
      setScale(s);
      setHeight(content.offsetHeight * s);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [nativeWidth]);

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden ${className}`} style={{ height }}>
      <div
        ref={contentRef}
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: nativeWidth, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
