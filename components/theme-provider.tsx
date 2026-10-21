"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Theme = "light" | "dark" | "system";
export type Resolved = "light" | "dark";

const STORAGE_KEY = "coachpro-theme";

/**
 * Inline script that applies the saved theme before first paint (no flash).
 * Default is LIGHT: with no stored choice we pin data-theme="light" so a
 * dark-OS machine still opens in light. Users can still opt into dark/system.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}')||'light';if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

interface Ctx {
  theme: Theme;
  resolved: Resolved;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<Ctx>({
  theme: "light",
  resolved: "light",
  setTheme: () => {},
});

const systemDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const resolve = (t: Theme): Resolved =>
  t === "system" ? (systemDark() ? "dark" : "light") : t;

function apply(t: Theme) {
  const root = document.documentElement;
  if (t === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", t);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolved, setResolved] = useState<Resolved>("light");

  useEffect(() => {
    // Read the persisted choice on mount (localStorage is client-only).
    // Default is light when nothing has been chosen yet.
    let stored: Theme = "light";
    try {
      stored = (localStorage.getItem(STORAGE_KEY) as Theme) || "light";
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(stored);
    setResolved(resolve(stored));
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      let stored: Theme = "system";
      try {
        stored = (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
      } catch {}
      if (stored === "system") setResolved(systemDark() ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {}
    const root = document.documentElement;
    root.classList.add("theme-animate");
    apply(t);
    setThemeState(t);
    setResolved(resolve(t));
    window.setTimeout(() => root.classList.remove("theme-animate"), 300);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
