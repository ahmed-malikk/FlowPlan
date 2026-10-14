"use client";

import { useEffect, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { hasSeen, markSeen } from "@/lib/seen";

/**
 * "2d slack", and what that means. The explanation shows by itself the first time a visitor
 * hovers or keyboard-focuses a slack chip (once ever), and any time the chip is tapped or clicked.
 */
export function SlackChip({ days }: { days: number }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function show(auto: boolean) {
    if (auto) {
      if (hasSeen("slack-tip")) return;
      markSeen("slack-tip");
    }
    setOpen(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 4500);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        onPointerEnter={(e) => e.pointerType === "mouse" && show(true)}
        onFocus={(e) => e.currentTarget.matches(":focus-visible") && show(true)}
        onClick={() => markSeen("slack-tip")}
        className="relative inline-flex cursor-help rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs whitespace-nowrap after:absolute after:inset-x-0 after:-inset-y-3 after:content-['']"
        aria-label={`${days} days slack. What is slack?`}
      >
        {days}d slack
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-3 text-[13.5px]"
        // Reading a tip must never move the keyboard cursor.
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        Slack: this task can start up to {days} day{days === 1 ? "" : "s"} late without moving the finish date.
      </PopoverContent>
    </Popover>
  );
}
