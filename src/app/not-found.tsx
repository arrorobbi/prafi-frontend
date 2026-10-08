import Link from "next/link";
import { Brand } from "@/components/ui";
import { buttonVariants } from "@/components/shadcn/button";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <Brand />
        <h1 className="page-title" style={{ fontSize: "clamp(3rem, 10vw, 5rem)" }}>
          404
        </h1>
        <p>Halaman yang Anda cari tidak ditemukan atau produk sudah tidak tersedia.</p>
        <Link href="/" className={buttonVariants({ variant: "orange", size: "lg" })}>
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
