import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowPlan · critical path planner",
  description:
    "Enter tasks, durations and dependencies. FlowPlan finds the critical path, the finish date and how many days every task can slip.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container site-header-inner">
            <Link href="/" className="brand">
              <span className="brand-mark" aria-hidden>
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <circle cx="5" cy="12" r="3" />
                  <circle cx="19" cy="6" r="3" />
                  <circle cx="19" cy="18" r="3" />
                  <path d="M8 12 L16 6.8 M8 12 L16 17.2" strokeWidth="2" fill="none" />
                </svg>
              </span>
              FlowPlan
            </Link>
            <span className="tagline">Critical path planning for small teams</span>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="container site-footer">
          Saved in this browser only · no account needed ·{" "}
          <a href="https://github.com/ahmed-malikk/FlowPlan" target="_blank" rel="noreferrer">
            Source on GitHub
          </a>
        </footer>
        {/* Vercel Web Analytics: anonymous page views on the live site only (does nothing locally). */}
        <Analytics />
      </body>
    </html>
  );
}
