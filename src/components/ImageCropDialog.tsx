"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { cropHint, cropImage, type CropSpec } from "@/lib/imageTools";
import { Modal } from "./Modal";
import { Button } from "./shadcn/button";
import { Alert } from "./shadcn/alert";

/**
 * Crop before upload: the picture is shown under a frame of the exact shape of the place it will appear (CROP in
 * lib/imageTools.ts); drag to move it, use the slider or pinch to zoom. "Gunakan" saves that part, compressed to 3 MB.
 */
export function ImageCropDialog({
  file,
  spec,
  onDone,
  onCancel,
}: {
  /** The picked file; null = closed */
  file: { blob: Blob; url: string; name: string } | null;
  spec: CropSpec;
  onDone: (cropped: File) => void;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onCropComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  const close = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setError(null);
    onCancel();
  };

  const done = async () => {
    if (!file || !area) return;
    setBusy(true);
    setError(null);
    try {
      onDone(await cropImage(file.blob, area, spec, file.name));
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gambar gagal diproses");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!file} title="Atur Potongan Gambar" onClose={busy ? () => {} : close} wide>
      <div className="grid gap-3">
        <p className="text-[0.9rem] text-muted-foreground">
          Geser gambar dan atur zoom agar bagian yang penting berada di dalam bingkai. {cropHint(spec)}.
        </p>
        <div className="relative h-[min(60dvh,420px)] w-full overflow-hidden rounded-xl bg-[#1f2937]">
          {file && (
            <Cropper
              image={file.url}
              crop={crop}
              zoom={zoom}
              aspect={spec.aspect}
              cropShape={spec.round ? "round" : "rect"}
              showGrid={!spec.round}
              minZoom={1}
              maxZoom={4}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>
        <label className="flex items-center gap-3 text-[0.88rem] font-semibold">
          Zoom
          <input
            type="range"
            min={1}
            max={4}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-[var(--orange)]"
            aria-label="Perbesar atau perkecil gambar"
          />
        </label>
        {error && <Alert variant="destructive">{error}</Alert>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="light" onClick={close} disabled={busy}>
            Batal
          </Button>
          <Button type="button" variant="navy" onClick={done} disabled={busy || !area}>
            {busy ? "Memproses..." : "Gunakan Gambar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
