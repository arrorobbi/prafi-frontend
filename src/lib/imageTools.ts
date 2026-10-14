/**
 * Pictures prepared in the browser before they are uploaded: cropped to the shape of the place they will be shown,
 * and compressed to at most MAX_UPLOAD_BYTES (the backend compresses anything bigger too, as a safety net).
 */

/** The largest picture the site stores */
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
/** The largest file that may be picked at all (it is compressed before uploading) */
export const MAX_PICK_BYTES = 25 * 1024 * 1024;

export interface CropSpec {
  /** width / height */
  aspect: number;
  /** As shown to people, e.g. "1:1" */
  ratio: string;
  /** The size the crop is saved at (smaller when the picked photo is smaller: never enlarged) */
  width: number;
  height: number;
  /** Round preview (logos, account photos) */
  round?: boolean;
}

/**
 * The crop of each place a picture is shown. Product photos are square: they appear as squares in lists and nearly
 * square on the product page. The carousel's centre slide is 2:3; the BUMDES card on Beranda is 16:10.
 */
export const CROP: Record<"product" | "logo" | "category" | "bumdes" | "face", CropSpec> = {
  product: { aspect: 1, ratio: "1:1", width: 1000, height: 1000 },
  logo: { aspect: 1, ratio: "1:1", width: 500, height: 500, round: true },
  category: { aspect: 2 / 3, ratio: "2:3", width: 800, height: 1200 },
  bumdes: { aspect: 16 / 10, ratio: "16:10", width: 1280, height: 800 },
  face: { aspect: 1, ratio: "1:1", width: 720, height: 720, round: true },
};

/** "Rasio 1:1 · disarankan 1000 × 1000 px" */
export const cropHint = (spec: CropSpec) => `Rasio ${spec.ratio} · disarankan ${spec.width} × ${spec.height} px`;

let webpSupport: boolean | null = null;
/** WebP keeps photos smaller and logos transparent; older Safari can't make it, so JPEG then */
function outputType() {
  if (webpSupport === null) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    webpSupport = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  }
  return webpSupport ? "image/webp" : "image/jpeg";
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Gambar gagal diproses"))), type, quality));

const extension = (type: string) => (type === "image/webp" ? ".webp" : ".jpg");
const renamed = (name: string, type: string) => `${name.replace(/\.[^.]+$/, "") || "gambar"}${extension(type)}`;

/** Loads a picture the right way up (phone photos carry their rotation as a note) */
async function load(source: Blob) {
  return createImageBitmap(source, { imageOrientation: "from-image" });
}

/**
 * Draws `area` of `image` at `width` × `height` and saves it at the best quality that fits MAX_UPLOAD_BYTES,
 * scaling down further if even the lowest quality is too big.
 */
async function encode(image: CanvasImageSource, area: { x: number; y: number; width: number; height: number }, width: number, height: number, name: string) {
  const type = outputType();
  for (let scale = 1; scale > 0.3; scale *= 0.75) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d")!;
    // JPEG has no transparency: a white background instead of black
    if (type === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.9, 0.8, 0.7, 0.6, 0.5]) {
      const blob = await toBlob(canvas, type, quality);
      if (blob.size <= MAX_UPLOAD_BYTES) return new File([blob], renamed(name, type), { type });
    }
  }
  throw new Error("Gambar terlalu besar dan tidak dapat dikompres, pilih foto lain");
}

/** A picked file as it may be uploaded: unchanged when it is 3 MB or less, otherwise compressed (at most 2560 px). */
export async function compressImage(file: File): Promise<File> {
  if (file.size <= MAX_UPLOAD_BYTES) return file;
  const image = await load(file);
  try {
    const scale = Math.min(1, 2560 / Math.max(image.width, image.height));
    return await encode(image, { x: 0, y: 0, width: image.width, height: image.height }, image.width * scale, image.height * scale, file.name);
  } finally {
    image.close();
  }
}

/** Cuts `area` (in the picture's own pixels) out of `source` at the size of `spec`, never enlarging it. */
export async function cropImage(source: Blob, area: { x: number; y: number; width: number; height: number }, spec: CropSpec, name: string) {
  const image = await load(source);
  try {
    const scale = Math.min(1, spec.width / area.width);
    return await encode(image, area, area.width * scale, area.height * scale, name);
  } finally {
    image.close();
  }
}
