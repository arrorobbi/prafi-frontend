"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { IconClose } from "./Icons";

/**
 * The picture popup: any picture on the site that isn't itself a link opens here, larger, instead of in a new tab
 * (`<Thumb zoom … />`). Esc, the ✕ button or a click outside the picture closes it; focus goes back to the picture.
 */
type Open = (src: string, alt?: string) => void;

const LightboxContext = createContext<Open>(() => {});

/** Opens the popup with this picture. Outside the provider it does nothing. */
export const useLightbox = () => useContext(LightboxContext);

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [picture, setPicture] = useState<{ src: string; alt: string } | null>(null);
  const [shown, setShown] = useState(false);
  /** The picture that was clicked: focus returns to it when the popup closes */
  const opener = useRef<HTMLElement | null>(null);
  const open = useCallback<Open>((src, alt = "") => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setPicture({ src, alt });
    setShown(true);
  }, []);

  return (
    <LightboxContext.Provider value={open}>
      {children}
      <DialogPrimitive.Root open={shown} onOpenChange={setShown}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-black/80 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              opener.current?.focus();
            }}
            // The whole screen is the popup, so a click beside the picture closes it
            onClick={(e) => e.target === e.currentTarget && setShown(false)}
            className="fixed inset-0 z-[70] flex cursor-zoom-out flex-col items-center justify-center gap-3 p-4 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          >
            <DialogPrimitive.Title className="sr-only">{picture?.alt || "Gambar"}</DialogPrimitive.Title>
            {picture && (
              // Plain <img>: uploaded photos come from the API as they are
              <img
                src={picture.src}
                alt={picture.alt}
                className="max-h-[calc(100dvh-7rem)] max-w-full cursor-default rounded-xl bg-white object-contain shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              />
            )}
            {picture?.alt && <p className="max-w-[min(90vw,720px)] cursor-default text-center text-[0.9rem] text-white/90 [overflow-wrap:anywhere]">{picture.alt}</p>}
            <DialogPrimitive.Close
              aria-label="Tutup gambar"
              className="absolute top-3 right-3 grid size-11 cursor-pointer place-items-center rounded-full border-0 bg-white/15 text-white transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-white [&_svg]:size-5"
            >
              <IconClose />
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </LightboxContext.Provider>
  );
}
