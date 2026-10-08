import Link from "next/link";
import { Step, Steps } from "@/components/GuideSteps";
import {
  IconBell,
  IconCamera,
  IconCheckCircle,
  IconDocs,
  IconHeadset,
  IconLock,
  IconPlus,
  IconSearch,
  IconSettings,
  IconStore,
  IconUser,
} from "@/components/Icons";

/** Contact for the "Hubungi Administrator" guide; set in .env (see README). */
export const ADMIN_CONTACT = {
  whatsapp: process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? "",
  email: process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "",
};

export interface Guide {
  id: string;
  title: string;
  summary: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  audience: ("public" | "tenant" | "admin")[];
  body: React.ReactNode;
}

function Contact() {
  const wa = ADMIN_CONTACT.whatsapp.replace(/\D/g, "");
  return (
    <>
      <p>Butuh bantuan pendaftaran, verifikasi produk, atau akun Anda dinonaktifkan? Hubungi administrator Trans Niaga:</p>
      <ul>
        {wa && (
          <li>
            WhatsApp:{" "}
            <a href={`https://wa.me/${wa.replace(/^0/, "62")}`} target="_blank" rel="noreferrer">
              {ADMIN_CONTACT.whatsapp}
            </a>
          </li>
        )}
        {ADMIN_CONTACT.email && (
          <li>
            Email: <a href={`mailto:${ADMIN_CONTACT.email}`}>{ADMIN_CONTACT.email}</a>
          </li>
        )}
        {!wa && !ADMIN_CONTACT.email && <li>Datang langsung ke kantor pengelola UMKM Kawasan Transmigrasi Prafi, Manokwari.</li>}
      </ul>
      <p>Sertakan nama toko dan email akun Anda agar kami dapat membantu lebih cepat.</p>
    </>
  );
}

/**
 * Screenshots live in public/panduan (taken from the real UI with sample data).
 * The part of each picture that a step talks about is outlined in red.
 */
export const GUIDES: Guide[] = [
  {
    id: "mencari-produk",
    title: "Cara Mencari Produk",
    summary: "Menjelajah beranda, mencari produk, dan melihat detail",
    icon: IconSearch,
    color: "#0e3c69",
    audience: ["public"],
    body: (
      <Steps>
        <Step image="pengunjung-1-beranda" alt="Menu utama di beranda">
          Gunakan menu <b>Beranda</b>, <b>Produk</b>, dan <b>UMKM</b> di bagian atas untuk menjelajah produk dan toko.
        </Step>
        <Step image="pengunjung-2-cari" alt="Kotak pencarian">
          Klik ikon <b>kaca pembesar</b>, ketik nama produk atau toko. Pilih salah satu saran, atau tekan <b>Enter</b>{" "}
          untuk melihat semua hasil.
        </Step>
        <Step image="pengunjung-3-detail" alt="Halaman detail produk">
          Halaman detail menampilkan harga, deskripsi, informasi produk, dan ulasan pembeli. Anda dapat memberi
          bintang dan ulasan tanpa login. Klik nama toko untuk membuka halaman UMKM: profil, alamat, jam buka,
          tombol WhatsApp/Instagram/Shopee/Google Bisnis, jumlah produk, rata-rata bintang, dan semua produknya.
        </Step>
      </Steps>
    ),
  },
  {
    id: "cara-daftar",
    title: "Cara Mendaftar sebagai Penjual",
    summary: "Membuat akun penjual dan memverifikasi email",
    icon: IconUser,
    color: "#ea7b25",
    audience: ["public", "tenant"],
    body: (
      <Steps>
        <Step image="daftar-1-login" alt="Tombol DAFTAR di halaman login">
          Buka halaman <Link href="/register">Daftar</Link> (tombol <b>Login</b> → <b>DAFTAR</b>).
        </Step>
        <Step image="daftar-2-informasi-akun" alt="Formulir informasi akun">
          <b>Tahap 1 – Informasi Akun:</b> isi nama lengkap, nomor telepon/WhatsApp, email aktif, nama usaha/toko, dan
          password (minimal 8 karakter), lalu klik <b>SELANJUTNYA</b>.
        </Step>
        <Step image="daftar-3-review" alt="Halaman review data">
          <b>Tahap 2 – Review Data:</b> periksa kembali data Anda. Klik <b>EDIT DATA</b> bila ada yang salah, lalu{" "}
          <b>KIRIM PENDAFTARAN</b>.
        </Step>
        <Step image="daftar-4-otp" alt="Kolom kode OTP">
          <b>Tahap 3 – Verifikasi Email:</b> buka email Anda, salin <b>kode OTP 6 digit</b> (berlaku 15 menit) dan
          masukkan. Tidak menerima kode? Periksa folder spam atau klik <b>Kirim ulang kode</b> setelah 60 detik.
        </Step>
        <Step image="daftar-5-selesai" alt="Halaman pendaftaran selesai">
          <b>Tahap 4 – Selesai:</b> Anda otomatis masuk. Klik <b>LENGKAPI PROFIL TOKO</b> untuk melanjutkan.
        </Step>
      </Steps>
    ),
  },
  {
    id: "profil-toko",
    title: "Membuat Profil Toko (Profil UMKM)",
    summary: "Logo, kategori, wilayah, alamat, jam operasional, dan kontak",
    icon: IconStore,
    color: "#0e3c69",
    audience: ["public", "tenant"],
    body: (
      <Steps>
        <Step image="profil-1-lihat" alt="Halaman Profil UMKM">
          Masuk, lalu buka menu <b>Profil UMKM</b>. Jika profil sudah ada, klik <b>Ubah Profil</b>; jika belum, formulir
          langsung terbuka.
        </Step>
        <Step image="profil-2-form" alt="Formulir profil toko">
          Pilih logo atau foto toko (JPG/PNG/WEBP, maksimal 5 MB): foto langsung terunggah, tetapi baru tersimpan
          setelah Anda klik <b>SIMPAN PROFIL</b>. Isi nama toko, wilayah (SP 1 – SP 4 atau lainnya), kategori usaha,
          deskripsi, alamat lengkap, jam operasional (hari, jam buka, jam tutup), dan nomor WhatsApp. Tautan Google
          Maps, Facebook, Instagram, Google Bisnis, dan Shopee boleh dikosongkan.
        </Step>
        <Step image="profil-3-simpan" alt="Tombol simpan profil">
          Klik <b>SIMPAN PROFIL</b>. Profil dapat diubah kapan saja lewat tombol <b>Ubah Profil</b>. Agar dapat
          menambahkan produk, profil harus lengkap <b>dan</b> akun Anda harus memiliki foto profil (menu{" "}
          <b>Pengaturan Akun</b>).
        </Step>
      </Steps>
    ),
  },
  {
    id: "tambah-produk",
    title: "Panduan Menambahkan Produk",
    summary: "Langkah-langkah menambahkan produk baru ke Trans Niaga",
    icon: IconPlus,
    color: "#13a10e",
    audience: ["public", "tenant"],
    body: (
      <Steps>
        <Step image="produk-1-menu" alt="Menu Tambah Produk">
          Masuk ke dashboard penjual, lalu klik menu <b>Tambah Produk</b> (atau tombol <b>+</b> di halaman Produk Saya).
          Bila muncul pesan <b>Lengkapi data Anda dulu</b>, klik tombolnya untuk melengkapi Profil UMKM atau
          mengunggah foto profil akun.
        </Step>
        <Step image="produk-2-foto" alt="Kotak unggah foto produk">
          Klik kotak <b>UNGGAH FOTO PRODUK</b> → <b>PILIH FILE</b> dan pilih foto produk. Foto langsung terunggah
          (ada tanda persen), tetapi baru tersimpan setelah Anda klik <b>Ajukan Produk</b>.
        </Step>
        <Step image="produk-3-isi-data" alt="Isian data produk">
          Isi <b>Nama Produk</b> dan <b>Harga</b> (dalam Rupiah), lalu <b>Deskripsi Produk</b> (penjelasan singkat) dan
          <b>Informasi Produk</b> (bahan, ukuran, cara penggunaan, keunggulan). Masing-masing maksimal 255 karakter.
          Centang <b>Jadikan produk rekomendasi</b> agar produk tampil di rekomendasi halaman utama setelah disetujui.
        </Step>
        <Step image="produk-4-ajukan" alt="Tombol Ajukan Produk">
          Klik <b>Ajukan Produk</b>. Status produk menjadi <b>Menunggu Konfirmasi</b> dan Anda menerima notifikasi.
        </Step>
        <Step image="produk-5-status" alt="Status produk di Produk Saya">
          Pantau status di <b>Produk Saya</b>. Setelah administrator atau Disnakertrans menyetujui, status berubah
          menjadi <b>Aktif</b> dan produk tampil di halaman utama. Anda juga menerima notifikasi untuk setiap
          perubahan status.
        </Step>
      </Steps>
    ),
  },
  {
    id: "status-produk",
    title: "Status Produk & Produk Ditolak",
    summary: "Arti setiap status dan cara mengajukan ulang",
    icon: IconCheckCircle,
    color: "#1aa5d9",
    audience: ["public", "tenant"],
    body: (
      <>
        <ul>
          <li>
            <b>Menunggu Konfirmasi</b> – produk sedang diperiksa administrator atau Disnakertrans.
          </li>
          <li>
            <b>Aktif</b> – produk disetujui dan tampil untuk pengunjung.
          </li>
          <li>
            <b>Ditolak</b> – produk belum memenuhi ketentuan; alasannya terlihat di menu <b>Produk Ditolak</b>.
          </li>
          <li>
            <b>Dinonaktifkan</b> – produk diturunkan administrator atau Disnakertrans dari halaman utama.
          </li>
        </ul>
        <p>Untuk mengajukan ulang produk yang ditolak:</p>
        <Steps>
          <Step image="status-1-ditolak" alt="Daftar produk ditolak">
            Buka <b>Produk Ditolak</b>, baca alasan penolakan, lalu klik ikon <b>pensil</b>.
          </Step>
          <Step image="status-2-ajukan-ulang" alt="Halaman ubah produk">
            Perbaiki data sesuai alasan, lalu klik <b>Simpan &amp; Ajukan Ulang</b>. Produk kembali berstatus{" "}
            <b>Menunggu Konfirmasi</b>.
          </Step>
        </Steps>
      </>
    ),
  },
  {
    id: "notifikasi",
    title: "Notifikasi",
    summary: "Pemberitahuan untuk setiap perubahan pada produk Anda",
    icon: IconBell,
    color: "#ea7b25",
    audience: ["public", "tenant"],
    body: (
      <Steps>
        <Step image="notifikasi-1" alt="Halaman notifikasi">
          Menu <b>Notifikasi</b> (dengan angka belum dibaca) memiliki tab <b>Semua</b>, <b>Belum Dibaca</b>, dan{" "}
          <b>Dibaca</b>. Klik notifikasi untuk membuka halaman terkait, atau klik{" "}
          <b>Tandai semua sebagai sudah dibaca</b>.
        </Step>
        <Step>
          Penjual menerima notifikasi untuk setiap perubahan pada produknya: <b>Produk Berhasil Diajukan</b>,{" "}
          <b>Produk Disetujui</b>, <b>Produk Ditolak</b> atau <b>Produk Dinonaktifkan</b> (beserta alasannya),{" "}
          <b>Perubahan Produk Tersimpan</b>, dan <b>Ulasan Baru</b> dari pembeli.
        </Step>
      </Steps>
    ),
  },
  {
    id: "ketentuan-foto",
    title: "Ketentuan Foto / Deskripsi",
    summary: "Aturan foto produk dan deskripsi yang harus dipenuhi",
    icon: IconCamera,
    color: "#1aa5d9",
    audience: ["public", "tenant"],
    body: (
      <ul>
        <li>Format JPG, PNG, WEBP, atau GIF dengan ukuran maksimal 5 MB.</li>
        <li>Foto jelas, terang, tidak buram, dan menampilkan produk yang sebenarnya dijual.</li>
        <li>Tidak memuat nomor telepon, tautan, atau watermark toko lain.</li>
        <li>Nama produk singkat dan sesuai isi; deskripsi jujur dan tidak menyesatkan.</li>
        <li>Produk tidak melanggar hukum, norma kesusilaan, maupun hak cipta.</li>
        <li>Satu foto hanya dapat dipakai untuk satu produk.</li>
      </ul>
    ),
  },
  {
    id: "akun",
    title: "Mengelola Akun & Password",
    summary: "Ubah data akun, foto, password, dan lupa password",
    icon: IconLock,
    color: "#0e3c69",
    audience: ["public", "tenant", "admin"],
    body: (
      <>
        <Steps>
          <Step image="akun-1-pengaturan" alt="Halaman pengaturan akun">
            Menu <b>Pengaturan Akun</b>: ubah nama, email, nomor telepon, atau foto profil, lalu klik{" "}
            <b>SIMPAN PERUBAHAN</b>. Foto baru langsung terunggah saat dipilih, tetapi baru terpasang setelah Anda
            klik <b>SIMPAN PERUBAHAN</b>. Untuk mengganti password, klik <b>Ubah Password</b>, masukkan password saat
            ini dan password baru (minimal 8 karakter).
          </Step>
          <Step image="akun-2-lupa-password" alt="Halaman lupa password">
            Lupa password? Di halaman Login klik <b>Lupa Password</b>, masukkan email, lalu buka tautan di email
            (berlaku 30 menit, sekali pakai) untuk membuat password baru. Semua sesi login lain akan berakhir.
          </Step>
        </Steps>
        <p>
          Jika Anda meninggalkan halaman sebelum menyimpan foto yang baru diunggah, akan muncul konfirmasi{" "}
          <b>Tinggalkan halaman ini?</b>: pilih <b>Lanjut Suntingan</b> untuk kembali menyunting, atau <b>Setuju</b>{" "}
          untuk keluar (foto tersebut dihapus dan tidak ada data yang berubah).
        </p>
        <p>Demi keamanan, sesi login berakhir otomatis setelah 1 jam; silakan login kembali.</p>
      </>
    ),
  },
  {
    id: "panduan-admin",
    title: "Panduan Administrator",
    summary: "Konfirmasi produk, kategori, dan aktivasi akun penjual",
    icon: IconSettings,
    color: "#ea7b25",
    audience: ["public", "admin"],
    body: (
      <Steps>
        <Step>
          Daftar di <Link href="/register/admin">halaman pendaftaran admin</Link>, verifikasi email dengan OTP, lalu
          tunggu akun diaktifkan oleh Disnakertrans.
        </Step>
        <Step image="admin-1-kategori" alt="Halaman Kategori UMKM">
          <b>Kategori UMKM</b>: isi nama kategori di panel oranye lalu klik <b>Simpan</b> (mis. Makanan Berat,
          Minuman) sebelum penjual membuat profil toko. Kategori yang masih dipakai tidak dapat dihapus.
        </Step>
        <Step image="admin-2-konfirmasi" alt="Daftar konfirmasi produk">
          <b>Konfirmasi Produk</b>: produk baru tampil di sini. Klik <b>Lihat Detail</b>, atau langsung ✔ untuk
          menerima dan ✖ untuk menolak.
        </Step>
        <Step image="admin-3-detail" alt="Detail produk untuk dikonfirmasi">
          Di halaman detail, klik <b>TERIMA PRODUK</b> atau isi <b>Alasan Penolakan</b> dan klik <b>TOLAK PRODUK</b>.
          Produk aktif dapat dinonaktifkan dari halaman yang sama.
        </Step>
        <Step image="admin-4-umkm" alt="Manajemen UMKM">
          <b>Manajemen UMKM</b>: aktifkan/nonaktifkan akun penjual (tab <b>Akun Penjual</b>) dan lihat detail toko
          (tab <b>Profil Toko</b>). <b>Manajemen Produk</b> menampilkan semua produk per status, kategori, dan
          penjual; <b>Notifikasi</b> berisi pengajuan produk baru dan pendaftaran penjual.
        </Step>
      </Steps>
    ),
  },
  {
    id: "panduan-disnakertrans",
    title: "Panduan Disnakertrans & Superadmin",
    summary: "Aktivasi akun admin dan pembuatan akun Disnakertrans",
    icon: IconUser,
    color: "#0e3c69",
    audience: ["public"],
    body: (
      <>
        <Steps>
          <Step image="superadmin-1-tambah" alt="Form tambah akun Disnakertrans">
            <b>Superadmin</b> membuat akun Disnakertrans di menu <b>Akun Disnakertrans → TAMBAH AKUN</b>, lalu klik{" "}
            <b>Buat Akun</b>. Pemilik akun menerima tautan aktivasi di email (berlaku 24 jam); password diberikan
            langsung oleh superadmin. Tautan kedaluwarsa? Klik <b>Kirim Ulang Verifikasi</b>.
          </Step>
          <Step image="disnakertrans-1-aktivasi" alt="Halaman aktivasi admin">
            <b>Disnakertrans</b> mengaktifkan akun admin baru di menu <b>Aktivasi Admin</b> dengan tombol{" "}
            <b>Aktifkan</b>. Admin baru hanya bisa login setelah diaktifkan; menonaktifkan akun langsung mengakhiri sesi
            admin tersebut.
          </Step>
        </Steps>
        <p>
          <b>Disnakertrans</b> juga dapat menyetujui, menolak, dan menonaktifkan produk di menu{" "}
          <b>Konfirmasi Produk</b>, sama seperti admin, dan menerima notifikasi produk yang sama.
        </p>
        <p>
          <b>Superadmin</b> dapat melihat semua data (hanya baca) dan membuka menu <b>Log API</b>: catatan setiap
          penambahan, perubahan, dan penghapusan data oleh pengguna yang login, baik yang berhasil maupun yang gagal
          (permintaan tamu dan permintaan baca tidak dicatat). Gunakan filter <b>Hasil</b> untuk melihat yang gagal.
        </p>
      </>
    ),
  },
  {
    id: "ketentuan",
    title: "Syarat & Ketentuan",
    summary: "Ketentuan penggunaan Trans Niaga",
    icon: IconDocs,
    color: "#4a4a4a",
    audience: ["public", "tenant"],
    body: (
      <ul>
        <li>Penjual wajib memberikan data diri dan data usaha yang benar.</li>
        <li>Setiap produk diverifikasi administrator sebelum tampil dan dapat dinonaktifkan bila melanggar ketentuan.</li>
        <li>Transaksi dilakukan langsung antara pembeli dan penjual; Trans Niaga berperan sebagai direktori UMKM.</li>
        <li>Akun yang melanggar ketentuan dapat dinonaktifkan oleh administrator.</li>
      </ul>
    ),
  },
  {
    id: "privasi",
    title: "Kebijakan Privasi",
    summary: "Data apa yang ditampilkan kepada publik",
    icon: IconLock,
    color: "#4a4a4a",
    audience: ["public", "tenant"],
    body: (
      <ul>
        <li>Halaman publik hanya menampilkan produk yang disetujui, nama toko, dan nama pemilik.</li>
        <li>Email dan nomor telepon akun tidak ditampilkan di halaman publik.</li>
        <li>Password disimpan terenkripsi dan tidak dapat dilihat siapa pun, termasuk administrator.</li>
      </ul>
    ),
  },
  {
    id: "hubungi-admin",
    title: "Hubungi Administrator",
    summary: "Butuh bantuan? Hubungi administrator UMKM Trans Niaga",
    icon: IconHeadset,
    color: "#e53030",
    audience: ["public", "tenant"],
    body: <Contact />,
  },
];
