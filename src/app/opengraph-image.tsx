import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

/**
 * The default sharing picture (1200×630) for pages without a photo of their own: what WhatsApp, Facebook and X show
 * when a link to the site is shared. Product and UMKM pages use their own photo instead.
 */
export const alt = "Trans Niaga — Produk Pilihan UMKM Kawasan Transmigrasi Prafi, Manokwari";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(path.join(process.cwd(), "public", "logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 56,
          padding: 72,
          background: "linear-gradient(135deg, #0e3c69 0%, #0a2d50 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <img src={logoSrc} width={300} height={300} alt="" style={{ background: "#ffffff", borderRadius: 48, padding: 18 }} />
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 680 }}>
          <div style={{ fontSize: 92, fontWeight: 800, color: "#ea7b25", lineHeight: 1, letterSpacing: -1 }}>TRANS NIAGA</div>
          <div style={{ fontSize: 40, fontWeight: 600, marginTop: 14 }}>Produk Pilihan Ada Disini</div>
          <div style={{ width: 120, height: 8, background: "#ea7b25", borderRadius: 4, marginTop: 30 }} />
          <div style={{ fontSize: 30, marginTop: 30, opacity: 0.9, lineHeight: 1.35 }}>
            Direktori dan marketplace UMKM Kawasan Transmigrasi Prafi, Manokwari, Papua Barat
          </div>
        </div>
      </div>
    ),
    size,
  );
}
