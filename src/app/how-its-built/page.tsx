import type { Metadata } from "next";

export const metadata: Metadata = { title: "How it's built · FlowPlan" };

// Placeholder so the header link works while the redesign is built. Replaced in issue #36.
export default function HowItsBuiltPage() {
  return (
    <section className="py-8">
      <h1 className="text-4xl font-semibold tracking-tight">How FlowPlan is built</h1>
      <p className="mt-3 max-w-prose text-muted-foreground">This page is being written.</p>
    </section>
  );
}
