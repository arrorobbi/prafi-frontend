import type { Metadata } from "next";
import { SITE_URL } from "./format";

/*
 * Search engine and sharing helpers: one canonical address per page, Open Graph / Twitter previews, and JSON-LD
 * structured data (what lets Google show stars, prices and shop details in results).
 */

export const SITE_NAME = "Trans Niaga";
export const SITE_TITLE = "TRANS NIAGA — Produk Pilihan Ada Disini";
export const SITE_DESCRIPTION =
  "Direktori dan marketplace UMKM Kawasan Transmigrasi Prafi, Manokwari, Papua Barat. Temukan produk pilihan dari pelaku usaha lokal, lihat ulasan pembeli, dan hubungi penjualnya langsung.";
export const SITE_PLACE = "Kawasan Transmigrasi Prafi, Manokwari, Papua Barat";

/** The default sharing picture (app/opengraph-image.tsx), for pages without a photo of their own */
const DEFAULT_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "Trans Niaga — Produk Pilihan UMKM Kawasan Transmigrasi Prafi, Manokwari" };

/** Absolute address of a path of this site, e.g. abs("/produk") */
export const abs = (path = "/") => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** One line for meta descriptions and previews: whitespace collapsed, cut at a word near `max` characters. */
export function summarize(text: string | null | undefined, max = 160) {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 30)).trimEnd()}…`;
}

/**
 * Metadata of a public page: its canonical address (so ?filters and http/https copies count as one page) and the
 * preview shown when the link is shared (WhatsApp, Facebook, X). `image`: a path or absolute URL; without one the
 * site's default preview picture is used.
 */
export function pageMeta({
  title,
  description,
  path,
  image,
  index = true,
}: {
  /** Without the site name (the layout's template adds it); omit for the home page */
  title?: string;
  description?: string;
  /** Canonical path, e.g. "/produk/123" */
  path: string;
  image?: { url: string; alt: string } | null;
  /** false: keep the page out of search results (it may still be followed) */
  index?: boolean;
}): Metadata {
  const desc = description ? summarize(description) : undefined;
  // A page that sets its own openGraph replaces the layout's whole block, picture included: so always name one
  const images = [image ? { url: image.url, alt: image.alt } : DEFAULT_IMAGE];
  return {
    ...(title && { title }),
    ...(desc && { description: desc }),
    alternates: { canonical: path },
    ...(!index && { robots: { index: false, follow: true } }),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "id_ID",
      url: path,
      title: title ? `${title} | TRANS NIAGA` : SITE_TITLE,
      ...(desc && { description: desc }),
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: title ? `${title} | TRANS NIAGA` : SITE_TITLE,
      ...(desc && { description: desc }),
      images: images.map((i) => i.url),
    },
  };
}

/** Structured data for search engines. `data` is our own object; "<" is escaped so it can't close the script tag. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export const ORGANIZATION_LD = {
  "@type": "Organization",
  "@id": abs("/#organization"),
  name: SITE_NAME,
  alternateName: "UMKM Trans Niaga",
  url: abs("/"),
  logo: abs("/logo.png"),
  description: SITE_DESCRIPTION,
  areaServed: SITE_PLACE,
};

/** "Beranda › Produk › Kopi" trail for search results */
export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: abs(item.path) })),
  };
}
