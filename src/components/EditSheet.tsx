"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { TaskForm } from "@/components/TaskForm";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Task } from "@/lib/scheduler";

type Props = {
  task: Task | null; // the task being edited, or null when closed
  tasks: Task[]; // every task in the plan
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
  onCloseAutoFocus?: (event: Event) => void; // Radix only restores focus to a Trigger, so the page does it
};

/**
 * The edit panel: slides in from the right on a laptop and up from the bottom on a phone.
 * It is a real dialog: focus moves in and is trapped, Escape closes, focus returns to the Edit
 * button or node that opened it.
 */
export function EditSheet({ task, tasks, onClose, onSave, onDelete, onCloseAutoFocus }: Props) {
  return (
    <DialogPrimitive.Root open={task !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-60 bg-g0/70 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className="fixed top-0 right-0 bottom-0 z-61 flex w-[min(420px,100%)] flex-col gap-4 overflow-auto border-l border-line-strong bg-card p-[22px] data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right max-[520px]:top-auto max-[520px]:w-full max-[520px]:max-h-[88dvh] max-[520px]:rounded-t-[20px] max-[520px]:border-t max-[520px]:border-l-0 max-[520px]:pb-[max(22px,env(safe-area-inset-bottom))] max-[520px]:data-[state=closed]:slide-out-to-bottom max-[520px]:data-[state=open]:slide-in-from-bottom"
        >
          {task && (
            <>
              <div>
                <DialogTitle>Edit task</DialogTitle>
                <DialogDescription className="mt-1">Change the name, the days or what it waits for.</DialogDescription>
              </div>
              <TaskForm
                key={task.id}
                tasks={tasks}
                initial={task}
                onSave={(t) => {
                  onSave(t);
                  onClose();
                }}
                onCancel={onClose}
              />
              <Button variant="destructive" className="self-start" onClick={() => onDelete(task.id)}>
                Delete task
              </Button>
            </>
          )}
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute top-3 right-3 grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:size-9"
          >
            <X className="size-5" aria-hidden="true" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
