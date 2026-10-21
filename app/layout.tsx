import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Fraunces, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider, themeScript } from "@/components/theme-provider";

// Display & headings — tight, confident grotesque
const fontDisplay = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

// Editorial serif — big cinematic display moments, italic vermilion accents
const fontSerif = Fraunces({
  variable: "--font-serif-ds",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
});

// Body, UI, labels and metric numbers
const fontSans = Hanken_Grotesk({
  variable: "--font-sans-ds",
  subsets: ["latin"],
});

// The data voice — overlines, deltas, units, timestamps, chart ticks
const fontMono = JetBrains_Mono({
  variable: "--font-mono-ds",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CoachPro: client tracking for personal trainers",
  description:
    "A private workspace for personal trainers to track each client's body metrics, health markers, and goals over time.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "CoachPro", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3ef" },
    { media: "(prefers-color-scheme: dark)", color: "#141210" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontDisplay.variable} ${fontSerif.variable} ${fontSans.variable} ${fontMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
