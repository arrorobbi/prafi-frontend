import type { Metadata } from "next";
import { RegisterWizard } from "@/components/auth/RegisterWizard";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Daftar sebagai Penjual UMKM",
  description:
    "Daftarkan usaha Anda di Trans Niaga, direktori UMKM Kawasan Transmigrasi Prafi, Manokwari. Gratis: buat akun, lengkapi profil toko, dan tampilkan produk Anda.",
  path: "/register",
});

export default function RegisterTenantPage() {
  return <RegisterWizard kind="tenant" />;
}
