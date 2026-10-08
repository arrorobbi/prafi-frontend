"use client";

import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./shadcn/alert-dialog";
import { Button } from "./shadcn/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./shadcn/dialog";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}

/** The site's popup, built on the shadcn Dialog (focus trap, Esc / click outside closes, scrolls when tall). */
export function Modal({ open, title, onClose, children, footer, wide }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className={cn("max-h-[90dvh] overflow-y-auto rounded-[20px] p-6", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}
      >
        <DialogHeader>
          <DialogTitle className="pr-6 text-lg font-bold text-brand-navy">{title}</DialogTitle>
        </DialogHeader>
        <div className="min-w-0">{children}</div>
        {footer && <DialogFooter className="gap-2">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * "Are you sure?" built on the shadcn AlertDialog. The confirm button doesn't close it by itself, so it stays open
 * (showing "Memproses...") until the action finishes and the caller closes it.
 */
export function ConfirmDialog({ open, title, message, confirmLabel = "Ya, lanjutkan", danger, busy, onConfirm, onClose }: ConfirmProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && !busy && onClose()}>
      <AlertDialogContent className="rounded-[20px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold text-brand-navy">{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-[0.95rem] leading-relaxed text-foreground">{message}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <Button variant="light" onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button variant={danger ? "red" : "navy"} onClick={onConfirm} disabled={busy}>
            {busy ? "Memproses..." : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
