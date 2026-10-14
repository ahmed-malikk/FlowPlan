"use client";

import { CircleHelp, MoreHorizontal, Printer, Trash2 } from "lucide-react";
import { PlanArt } from "@/components/PlanArt";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { isIsoDate } from "@/lib/plan";
import type { Status } from "@/lib/status";

type Props = {
  name: string;
  startDate: string;
  status: Status;
  complete: boolean;
  canPrint: boolean;
  onRename: (name: string) => void;
  onStartDate: (iso: string) => void;
  onPrint: () => void;
  onTour: () => void;
  onDelete: () => void;
};

/**
 * Title (click to rename), one status line, start date and the plan menu.
 * The finish date flips in when it changes; a polite live region announces the sentence.
 */
export function PlanHeader({ name, startDate, status, complete, canPrint, onRename, onStartDate, onPrint, onTour, onDelete }: Props) {
  return (
    <div className="relative mb-4 min-h-[110px]">
      <PlanArt complete={complete} />
      <h1 className="m-0">
        <label htmlFor="project-title" className="sr-only">
          Project name
        </label>
        <input
          id="project-title"
          value={name}
          onChange={(e) => onRename(e.target.value)}
          onBlur={(e) => {
            if (!e.target.value.trim()) onRename("Untitled project");
          }}
          className="w-full max-w-[min(720px,100%)] rounded-lg border border-transparent bg-transparent px-0 text-[clamp(30px,4.4vw,46px)] leading-[1.1] font-semibold tracking-tight text-foreground hover:border-border focus-visible:border-input min-[901px]:max-w-[56%]"
        />
      </h1>

      <p role="status" className="sr-only">
        {status.finishDate ? `Finishes ${status.finishDate}. ` : ""}
        {status.text}
      </p>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-[18px] gap-y-1.5" aria-hidden="true">
        {status.finishDate && (
          <span key={status.finishDate} className="fp-flip inline-block text-[34px] leading-none font-semibold tracking-tight">
            {status.finishDate}
          </span>
        )}
        <span className="text-sm text-muted-foreground">{status.text}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5 print:hidden">
        <label className="flex h-11 items-center gap-2.5 rounded-xl border border-input bg-g0/55 pr-2 pl-3.5 text-sm text-muted-foreground">
          Starts
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              if (isIsoDate(e.target.value)) onStartDate(e.target.value);
            }}
            className="h-10 bg-transparent text-foreground"
          />
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Plan menu">
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled={!canPrint} onSelect={onPrint}>
              <Printer className="size-4" aria-hidden="true" /> Print / PDF
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onTour}>
              <CircleHelp className="size-4" aria-hidden="true" /> Take the tour
            </DropdownMenuItem>
            <DropdownMenuItem destructive onSelect={onDelete}>
              <Trash2 className="size-4" aria-hidden="true" /> Delete project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
