"use client";

import { useEffect, useRef } from "react";
import { scrollProgress } from "@/lib/scrollProgress";

/**
 * A position marker for touch screens ("Route thread"). Phones draw their own thin scroll bars and
 * ignore styled ones, so the page draws this: a hairline route down the right edge, a blue-to-amber
 * fill for the part travelled, and a station dot where you are. It shows while the page scrolls,
 * fades out a moment after, never takes a touch, and is not rendered for mouse users, who get the
 * styled scrollbar instead.
 */
export function ScrollIndicator() {
  const track = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trackEl = track.current;
    const fillEl = fill.current;
    const dotEl = dot.current;
    if (!trackEl || !fillEl || !dotEl) return;
    let hide: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;

    const place = () => {
      frame = 0;
      const p = scrollProgress(window.scrollY, document.documentElement.scrollHeight, window.innerHeight);
      if (p === null) {
        trackEl.dataset.on = "false";
        return;
      }
      const y = p * trackEl.clientHeight;
      fillEl.style.height = `${y}px`;
      dotEl.style.transform = `translateY(${y}px)`;
      trackEl.dataset.on = "true";
      clearTimeout(hide);
      hide = setTimeout(() => (trackEl.dataset.on = "false"), 1100);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
      clearTimeout(hide);
    };
  }, []);

  return (
    <div
      ref={track}
      aria-hidden="true"
      data-scroll-indicator
      data-on="false"
      className="pointer-events-none fixed top-3 right-[7px] bottom-[78px] z-40 hidden w-3.5 opacity-0 transition-opacity duration-300 ease-(--ease-out-soft) data-[on=true]:opacity-100 [@media(hover:none)_and_(pointer:coarse)]:block print:hidden"
    >
      <div className="absolute inset-y-0 left-1.5 w-0.5 rounded-full bg-line-strong/55" />
      <div ref={fill} className="absolute top-0 left-1.5 h-0 w-0.5 rounded-full bg-linear-to-b from-line-strong to-primary" />
      <div ref={dot} className="absolute top-0 left-px -mt-1.5 size-3 rounded-full border-2 border-primary bg-g1" />
    </div>
  );
}
