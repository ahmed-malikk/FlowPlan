import { describe, expect, it } from "vitest";
import { pageTitle, sectionFor } from "./nav";

describe("sectionFor", () => {
  it("maps each page to its section", () => {
    expect(sectionFor("/")).toBe("plans");
    expect(sectionFor("/project/abc123")).toBe("plan");
    expect(sectionFor("/how-its-built")).toBe("built");
  });

  it("returns null for anything else", () => {
    expect(sectionFor("/nope")).toBeNull();
    expect(sectionFor("/project")).toBeNull();
  });
});

describe("pageTitle", () => {
  it("names the plans page and the How it's built page", () => {
    expect(pageTitle("/")).toBe("Your plans");
    expect(pageTitle("/how-its-built")).toBe("How it's built");
  });

  it("uses the plan's name on a plan page, with a fallback", () => {
    expect(pageTitle("/project/abc", "Website launch")).toBe("Website launch");
    expect(pageTitle("/project/abc", "   ")).toBe("Plan");
    expect(pageTitle("/project/abc")).toBe("Plan");
  });

  it("falls back to the product name on unknown paths", () => {
    expect(pageTitle("/nope")).toBe("FlowPlan");
  });
});
