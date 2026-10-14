"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Toasts are amber pills, as in the approved design. Delete shows one with an Undo action. */
const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="dark"
    position="bottom-center"
    // On a phone the tab bar owns the bottom 70 px, so toasts float above it.
    mobileOffset={{ bottom: 82 }}
    style={
      {
        "--normal-bg": "var(--primary)",
        "--normal-text": "var(--primary-foreground)",
        "--normal-border": "var(--primary)",
        "--border-radius": "999px",
      } as React.CSSProperties
    }
    toastOptions={{
      duration: 6000,
      classNames: {
        toast: "!w-auto !min-w-0 !px-[18px] !py-2.5 font-bold",
        actionButton: "!bg-transparent !text-primary-foreground !font-bold underline !h-8",
      },
    }}
    {...props}
  />
);

export { Toaster };
