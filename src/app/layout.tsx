import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import { LightboxProvider } from "@/components/Lightbox";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/lib/auth";
import { NavHistoryTracker } from "@/lib/navHistory";
import { SITE_URL } from "@/lib/format";
import { NavPendingProvider } from "@/lib/navPending";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from "@/lib/seo";
import "./shadcn.css";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

/**
 * Site-wide defaults; pages add their own title, description and canonical address (lib/seo.tsx → pageMeta).
 * The default sharing picture is app/opengraph-image.tsx. GOOGLE_SITE_VERIFICATION (.env, read at build time) is the
 * code Google Search Console gives to prove ownership of the site.
 */

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | TRANS NIAGA",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["UMKM Prafi", "UMKM Manokwari", "produk UMKM Papua Barat", "Trans Niaga", "Kawasan Transmigrasi Prafi", "BUMDES Prafi", "produk lokal Manokwari"],
  category: "shopping",
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "id_ID", title: SITE_TITLE, description: SITE_DESCRIPTION, url: "/" },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
  ...(process.env.GOOGLE_SITE_VERIFICATION && { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }),
};

export const viewport: Viewport = {
  themeColor: "#0e3c69",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={poppins.variable}>
        {/* Pages visited in this tab, for the back arrows (useSearchParams needs a Suspense boundary) */}
        <Suspense fallback={null}>
          <NavHistoryTracker />
        </Suspense>
        <AuthProvider>
          <ToastProvider>
            {/* A link click shows feedback at once (progress bar, public placeholders) until the page arrives */}
            <NavPendingProvider>
              {/* Pictures open larger in a popup instead of a new tab */}
              <LightboxProvider>{children}</LightboxProvider>
            </NavPendingProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
