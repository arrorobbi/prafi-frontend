import {
  IconBell,
  IconBox,
  IconCalculator,
  IconCamera,
  IconCheckCircle,
  IconDocs,
  IconHeadset,
  IconHeart,
  IconHelp,
  IconHome,
  IconLock,
  IconMapPin,
  IconMessage,
  IconPlus,
  IconSearch,
  IconSettings,
  IconStore,
  IconTag,
  IconUser,
  IconUsers,
} from "@/components/Icons";
import type { GuideAudience, GuideIcon } from "./types";

/*
 * The Panduan itself is content in the database, edited in "Kelola Panduan" (GET /api/landing/guides). This file
 * holds what the pages need around it.
 */

/** Contact for the {{kontak-admin}} block of the "Hubungi Administrator" topic; set in .env (see README). */
export const ADMIN_CONTACT = {
  whatsapp: process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? "",
  email: process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "",
};

/** The icon of each name a topic can have (the backend accepts the same names) */
export const GUIDE_ICONS: Record<GuideIcon, { label: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = {
  search: { label: "Pencarian", Icon: IconSearch },
  user: { label: "Pengguna", Icon: IconUser },
  users: { label: "Banyak pengguna", Icon: IconUsers },
  store: { label: "Toko", Icon: IconStore },
  plus: { label: "Tambah", Icon: IconPlus },
  check: { label: "Centang", Icon: IconCheckCircle },
  bell: { label: "Lonceng", Icon: IconBell },
  camera: { label: "Kamera", Icon: IconCamera },
  lock: { label: "Gembok", Icon: IconLock },
  settings: { label: "Pengaturan", Icon: IconSettings },
  docs: { label: "Dokumen", Icon: IconDocs },
  headset: { label: "Bantuan / kontak", Icon: IconHeadset },
  help: { label: "Tanda tanya", Icon: IconHelp },
  box: { label: "Kotak / produk", Icon: IconBox },
  tag: { label: "Label / kategori", Icon: IconTag },
  message: { label: "Pesan / ulasan", Icon: IconMessage },
  calculator: { label: "Kalkulator", Icon: IconCalculator },
  home: { label: "Beranda", Icon: IconHome },
  heart: { label: "Hati", Icon: IconHeart },
  map: { label: "Lokasi", Icon: IconMapPin },
};

export const GUIDE_AUDIENCE_LABEL: Record<GuideAudience, string> = {
  public: "Halaman Panduan (publik)",
  tenant: "Bantuan & Ketentuan (dashboard penjual)",
};
