import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Figtree, JetBrains_Mono } from "next/font/google";
import { NewProjectProvider } from "@/components/NewProjectProvider";
import { RouteBackdrop } from "@/components/RouteBackdrop";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TabBar } from "@/components/TabBar";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// next/font downloads the fonts at build time and serves them from our own site (no request to Google
// at runtime). Figtree carries all text; the monospace face is for dates and numbers.
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const viewport: Viewport = { themeColor: "#02050f", viewportFit: "cover" };

export const metadata: Metadata = {
  title: "FlowPlan · critical path planner",
  description:
    "Enter tasks, durations and dependencies. FlowPlan finds the critical path, the finish date and how many days every task can slip.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${jetbrainsMono.variable}`}>
      <body>
        {/* One column: backdrop behind everything, header, page, footer, and the phone tab bar stuck to the bottom. */}
        <NewProjectProvider>
        <div className="relative flex min-h-dvh flex-col">
          <RouteBackdrop />
          <SiteHeader />
          <main className="relative mx-auto w-full max-w-[1240px] flex-1 px-4 min-[521px]:px-[22px]">{children}</main>
          <SiteFooter />
          <TabBar />
        </div>
        </NewProjectProvider>
        <Toaster />
        {/* Vercel Web Analytics: anonymous page views on the live site only (does nothing locally). */}
        <Analytics />
      </body>
    </html>
  );
}
