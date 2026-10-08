import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/lib/auth";
import { NavHistoryTracker } from "@/lib/navHistory";
import "./shadcn.css";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: {
    default: "TRANS NIAGA — Produk Pilihan Ada Disini",
    template: "%s | TRANS NIAGA",
  },
  description:
    "Direktori dan marketplace UMKM Kawasan Transmigrasi Prafi, Manokwari. Temukan produk pilihan dari pelaku usaha lokal.",
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
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
