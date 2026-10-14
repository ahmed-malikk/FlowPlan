import type { Metadata } from "next";
import { HowItsBuiltView } from "@/components/HowItsBuiltView";

export const metadata: Metadata = {
  title: "How it's built · FlowPlan",
  description: "Who built FlowPlan, why, how the critical path is found, and what it runs on.",
};

export default function HowItsBuiltPage() {
  return <HowItsBuiltView />;
}
