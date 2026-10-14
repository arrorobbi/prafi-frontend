"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CROP, cropImage } from "@/lib/imageTools";
import { IconCamera } from "./Icons";
import { Modal } from "./Modal";
import { Button } from "./shadcn/button";
import { Alert } from "./shadcn/alert";

/**
 * Takes the account photo with the device's camera, in the browser: no file can be chosen. Live view with a round
 * guide → Ambil Foto → look at it → Ulangi or Gunakan Foto. The square in the middle of the frame is kept (720 px),
 * and the upload then checks it for a face (backend). Needs HTTPS and the visitor's permission for the camera.
 */
export function CameraCapture({ open, onClose, onCapture }: { open: boolean; onClose: () => void; onCapture: (file: File) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [cameras, setCameras] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [shot, setShot] = useState<{ blob: Blob; url: string; width: number; height: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const stop = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);

  const clearShot = useCallback(() => {
    setShot((s) => {
      if (s) URL.revokeObjectURL(s.url);
      return null;
    });
  }, []);

  // The camera runs only while the window is open and no photo is being looked at
  useEffect(() => {
    if (!open || shot) return;
    let cancelled = false;
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        window.isSecureContext
          ? "Browser ini tidak mendukung kamera. Gunakan Chrome, Firefox, Edge, atau Safari versi terbaru."
          : "Kamera hanya dapat dibuka di alamat yang aman (https://).",
      );
      return;
    }
    setStarting(true);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      .then(async (s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream.current = s;
        if (video.current) {
          video.current.srcObject = s;
          await video.current.play().catch(() => {});
        }
        const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
        setCameras(devices.filter((d) => d.kind === "videoinput").length);
      })
      .catch((err: DOMException) => {
        if (cancelled) return;
        setError(
          err.name === "NotAllowedError" || err.name === "SecurityError"
            ? "Izin kamera ditolak. Izinkan akses kamera untuk situs ini di pengaturan browser (ikon gembok di sebelah alamat), lalu coba lagi."
            : err.name === "NotFoundError" || err.name === "OverconstrainedError"
              ? "Kamera tidak ditemukan di perangkat ini. Foto profil harus diambil dengan kamera, gunakan HP atau laptop yang memiliki kamera."
              : err.name === "NotReadableError"
                ? "Kamera sedang dipakai aplikasi lain. Tutup aplikasi tersebut lalu coba lagi."
                : "Kamera tidak dapat dibuka. Coba lagi.",
        );
      })
      .finally(() => !cancelled && setStarting(false));
    return () => {
      cancelled = true;
      stop();
    };
  }, [open, shot, facing, stop]);

  // Closed: forget the photo
  useEffect(() => {
    if (!open) clearShot();
  }, [open, clearShot]);

  const take = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d")!;
    // The front camera is shown mirrored (like a mirror); the photo is saved the same way, as the person saw it
    if (facing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(v, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return setError("Foto gagal diambil, coba lagi.");
        stop();
        setShot({ blob, url: URL.createObjectURL(blob), width: canvas.width, height: canvas.height });
      },
      "image/jpeg",
      0.92,
    );
  };

  const use = async () => {
    if (!shot) return;
    setBusy(true);
    try {
      // The square in the middle of the frame
      const side = Math.min(shot.width, shot.height);
      const file = await cropImage(shot.blob, { x: (shot.width - side) / 2, y: (shot.height - side) / 2, width: side, height: side }, CROP.face, "foto-profil");
      onCapture(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Foto gagal diproses");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title="Ambil Foto Profil" onClose={busy ? () => {} : onClose} wide>
      <div className="grid gap-3">
        <p className="text-[0.9rem] text-muted-foreground">
          Posisikan wajah Anda di dalam lingkaran, menghadap kamera, dengan cahaya yang cukup. Foto disimpan berbentuk
          persegi ({CROP.face.ratio}).
        </p>
        <div className="relative mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-2xl bg-[#111827]">
          {shot ? (
            // Shows the same square that will be kept
            <img src={shot.url} alt="Foto yang diambil" className="h-full w-full object-cover" />
          ) : (
            <>
              <video
                ref={video}
                playsInline
                muted
                className="h-full w-full object-cover"
                style={facing === "user" ? { transform: "scaleX(-1)" } : undefined}
              />
              {/* Round guide for the face */}
              <span className="pointer-events-none absolute inset-[12%] rounded-full border-4 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              {starting && <span className="absolute inset-0 grid place-items-center text-sm text-white">Membuka kamera...</span>}
            </>
          )}
        </div>
        {error && <Alert variant="destructive">{error}</Alert>}
        <div className="flex flex-wrap justify-end gap-2">
          {!shot && cameras > 1 && (
            <Button type="button" variant="light" onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))} disabled={starting}>
              Ganti Kamera
            </Button>
          )}
          <Button type="button" variant="light" onClick={onClose} disabled={busy}>
            Batal
          </Button>
          {shot ? (
            <>
              <Button type="button" variant="light" onClick={clearShot} disabled={busy}>
                Ulangi
              </Button>
              <Button type="button" variant="navy" onClick={use} disabled={busy}>
                {busy ? "Memproses..." : "Gunakan Foto"}
              </Button>
            </>
          ) : (
            <Button type="button" variant="navy" onClick={take} disabled={starting || !!error}>
              <IconCamera /> Ambil Foto
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
