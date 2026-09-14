"use client";

import { useRef } from "react";
import { buttonClasses } from "./button";
import { cn } from "@/lib/utils";

export function Modal({
  triggerLabel,
  triggerVariant = "primary",
  title,
  children,
}: {
  triggerLabel: string;
  triggerVariant?: "primary" | "secondary" | "danger" | "ghost";
  title: string;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={buttonClasses(triggerVariant, "sm")}
      >
        {triggerLabel}
      </button>
      <dialog
        ref={dialogRef}
        className={cn(
          "w-full max-w-md rounded-md border border-line-300 p-0 backdrop:bg-ink-900/50",
          "open:animate-none"
        )}
      >
        <div className="flex items-center justify-between border-b border-line-200 px-5 py-3.5">
          <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="text-ink-500 hover:text-ink-900"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </dialog>
    </>
  );
}
