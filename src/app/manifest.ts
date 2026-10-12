import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

/** /manifest.webmanifest: name, colours and icon when the site is added to a phone's home screen */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trans Niaga — UMKM Kawasan Transmigrasi Prafi",
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: "id",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0e3c69",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/logo.png", sizes: "384x384", type: "image/png" },
    ],
  };
}
