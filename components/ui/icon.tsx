import * as React from "react";

/** Lightweight inline icon set (stroke = currentColor). */

const PATHS: Record<string, React.ReactNode> = {
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.8-5 6-5s6 1.7 6 5" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 6.4" />
      <path d="M17.5 15c2.3.4 3.5 1.9 3.5 5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  pulse: <path d="M3 12h4l2.5 7 4-14 2.5 7H21" />,
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  dumbbell: (
    <>
      <rect x="2" y="9" width="3" height="6" rx="1" />
      <rect x="19" y="9" width="3" height="6" rx="1" />
      <rect x="5" y="10.5" width="14" height="3" rx="1" />
    </>
  ),
  camera: (
    <>
      <path d="M3 8.5A2 2 0 0 1 5 6.5h1.6L8 4.5h8l1.4 2H19a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="12.5" r="3.4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9.5h18M8 3v4M16 3v4" />
    </>
  ),
  trendingUp: (
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M16 7h5v5" />
    </>
  ),
  trendingDown: (
    <>
      <path d="M3 7l6 6 4-4 8 8" />
      <path d="M16 17h5v-5" />
    </>
  ),
  flame: (
    <path d="M12 2.5c1.2 3.2 4.5 4.3 4.5 8.3a4.5 4.5 0 0 1-9 0c0-1.6.7-2.7 1.4-3.6.3 1 .9 1.7 1.8 2-.1-2.4.6-4.8 1.3-6.7z" />
  ),
  alert: (
    <>
      <path d="M12 3.5 2.5 20h19z" />
      <path d="M12 10v4.5" />
      <circle cx="12" cy="17.5" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
  check: <path d="M4.5 12.5l4.5 4.5L19.5 7" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  ruler: (
    <>
      <rect x="3" y="8" width="18" height="8" rx="1.5" />
      <path d="M7 8v3M11 8v4M15 8v3M19 8v4" />
    </>
  ),
  scale: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3.5v3.5" />
      <path d="M12 12l3.5-3.2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  sparkles: (
    <path d="M12 3l1.8 4.8L18.5 9l-4.7 1.3L12 15l-1.8-4.7L5.5 9l4.7-1.2zM18 14l.9 2.3 2.3.9-2.3.8L18 20l-.8-2-2.2-.8 2.2-.9z" />
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </>
  ),
  link: (
    <>
      <path d="M9.5 14.5l5-5" />
      <path d="M11 6.5l1.6-1.6a3.5 3.5 0 0 1 5 5L16 11.5" />
      <path d="M13 17.5l-1.6 1.6a3.5 3.5 0 0 1-5-5L8 12.5" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="M7 11l5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  home: (
    <>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v10h12V10" />
    </>
  ),
  utensils: (
    <>
      <path d="M6 3v8a2 2 0 0 0 2 2v8M10 3v8a2 2 0 0 1-2 2M8 3v6" />
      <path d="M17 21V3c-2 1.5-3 4-3 7v4h3" />
    </>
  ),
  droplet: <path d="M12 3.5s-6 6.6-6 11a6 6 0 0 0 12 0c0-4.4-6-11-6-11z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 18,
  className,
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
