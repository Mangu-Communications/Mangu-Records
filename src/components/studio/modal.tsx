import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  wide,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-background/70" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="forge-modal-title"
        className={cn(
          "relative w-full rounded-xl border border-border bg-card p-5 shadow-lg",
          wide ? "max-w-2xl" : "max-w-md",
        )}
      >
        <h2 id="forge-modal-title" className="font-display text-2xl italic">
          {title}
        </h2>
        <div className="mt-3 text-sm text-muted-foreground">{children}</div>
        <div className="mt-5 flex justify-end gap-2">
          {footer ?? (
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
