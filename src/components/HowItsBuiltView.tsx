"use client";

import { useEffect, useRef } from "react";
import { AlgorithmExplainer } from "@/components/AlgorithmExplainer";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { ARCHITECTURE, BUILT_BY, CREDITS, LINKS, METHOD, PROBLEM, STACK, STORY, TESTING } from "@/content/howItsBuilt";
import { routeProgress, stationReached } from "@/lib/scrollRoute";

const SECTION =
  "relative mb-14 before:absolute before:top-[5px] before:-left-[50px] before:size-[15px] before:rounded-full before:border-[3px] before:border-line-strong before:bg-g1 before:transition-colors before:duration-500 before:content-[''] data-[reached]:before:border-primary data-[reached]:before:bg-primary max-[520px]:before:-left-8";
const H2 = "mb-2.5 text-2xl font-semibold tracking-tight";
const P = "mb-3 max-w-[62ch] text-body-text";

/**
 * The page for people who want to know how FlowPlan was made. A route runs down the left side and
 * fills as you scroll, lighting a station at each section.
 */
export function HowItsBuiltView() {
  const route = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const el = route.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // At the very end of the page the last sections cannot scroll up to the drawing line, so the end counts as reaching everything.
      const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      el.style.setProperty("--p", (atEnd ? 1 : routeProgress(rect.top, rect.height, window.innerHeight)).toFixed(3));
      el.querySelectorAll<HTMLElement>("[data-station]").forEach((s) => {
        s.toggleAttribute("data-reached", atEnd || stationReached(s.getBoundingClientRect().top, window.innerHeight));
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const paragraphs = (items: string[]) => items.map((text) => <p key={text} className={P}>{text}</p>);
  const bullets = (items: string[]) => (
    <ul className="m-0 max-w-[62ch] list-disc pl-5 text-body-text">
      {items.map((text) => (
        <li key={text} className="mb-1.5">
          {text}
        </li>
      ))}
    </ul>
  );

  return (
    <article className="py-6 min-[521px]:py-8">
      <h1 className="fp-enter text-[clamp(30px,4.4vw,46px)] leading-[1.05] font-semibold tracking-tight">How FlowPlan is built</h1>
      <p className="mt-3 mb-9 max-w-[60ch] text-muted-foreground">
        Who made it, why, how the critical path is found, and what it runs on, with links to the code and the documents.
      </p>

      <div
        ref={route}
        className="relative max-w-[860px] pl-14 before:absolute before:top-2 before:bottom-2 before:left-3.5 before:w-[3px] before:rounded-[3px] before:bg-[linear-gradient(var(--primary)_calc(var(--p,0)*100%),var(--border)_calc(var(--p,0)*100%))] before:content-[''] max-[520px]:pl-[34px] max-[520px]:before:left-2"
      >
        <section data-station className={SECTION}>
          <h2 className={H2}>{BUILT_BY.heading}</h2>
          {paragraphs(BUILT_BY.paragraphs)}
          <a href={BUILT_BY.github.href} target="_blank" rel="noreferrer" className="rounded-md text-amber-text underline underline-offset-4">
            {BUILT_BY.github.label}
          </a>
        </section>

        <section data-station className={SECTION}>
          <h2 className={H2}>{STORY.heading}</h2>
          {paragraphs(STORY.paragraphs)}
        </section>

        <section data-station className={SECTION}>
          <h2 className={H2}>{PROBLEM.heading}</h2>
          {paragraphs(PROBLEM.paragraphs)}
        </section>

        <section data-station className={SECTION}>
          <h2 className={H2}>{METHOD.heading}</h2>
          <p className={P}>{METHOD.intro}</p>
          <AlgorithmExplainer />
        </section>

        <section data-station className={SECTION}>
          <h2 className={H2}>{STACK.heading}</h2>
          {bullets(STACK.items)}
        </section>

        <section data-station className={SECTION}>
          <h2 className={H2}>{ARCHITECTURE.heading}</h2>
          <ArchitectureDiagram />
        </section>

        <section data-station className={SECTION}>
          <h2 className={H2}>{TESTING.heading}</h2>
          <p className={P}>
            <strong className="font-semibold text-foreground">{TESTING.unitTests} unit tests</strong> pass on the current version.
          </p>
          {bullets(TESTING.items)}
        </section>

        <section data-station className={SECTION}>
          <h2 className={H2}>{LINKS.heading}</h2>
          <div className="mt-1.5 grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
            {LINKS.items.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="block rounded-[14px] border border-line-strong bg-card px-4 py-3.5 font-semibold text-foreground transition-colors hover:border-primary"
              >
                {l.label}
                <small className="mt-0.5 block text-[13px] font-normal text-muted-foreground">{l.note}</small>
              </a>
            ))}
          </div>
        </section>

        <section data-station className={SECTION}>
          <h2 className={H2}>{CREDITS.heading}</h2>
          {bullets(CREDITS.items)}
        </section>
      </div>
    </article>
  );
}
