import Link from "next/link";
import { IconFacebook, IconInstagram, IconLink, IconMail, IconMapPin, IconPhone, IconWhatsapp } from "./Icons";
import styles from "./RichText.module.css";

/*
 * Button templates in staff texts (Kelola Panduan): {jenis: nilai} or {jenis: nilai | teks tombol}.
 *   {email: admin@contoh.com}                      → Email button (mailto:)
 *   {whatsapp: 0812… | Chat Admin | Halo, saya …}  → WhatsApp chat, the third part is a pre-filled message
 *   {telepon: 0812…}                               → call (tel:)
 *   {instagram: @akun}  {facebook: halaman}        → the profile
 *   {lokasi: https://maps.app.goo.gl/…}            → the place on Google Maps
 *   {tombol: /register | Daftar Sekarang}          → any page of the site or https:// link
 * A template that can't be read (e.g. a wrong email) stays as plain text, so the writer sees it.
 */

export const TEMPLATE_KINDS = ["email", "whatsapp", "wa", "telepon", "telp", "instagram", "ig", "facebook", "fb", "lokasi", "maps", "tombol", "link"] as const;
type Kind = (typeof TEMPLATE_KINDS)[number];

/** Finds the templates in a line (used to split it) */
export const TEMPLATE_RE = new RegExp(`\\{(?:${TEMPLATE_KINDS.join("|")})\\s*:[^{}\\n]+\\}`, "gi");
const ONE_RE = new RegExp(`^\\{(${TEMPLATE_KINDS.join("|")})\\s*:([^{}\\n]+)\\}$`, "i");

interface Button {
  href: string;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tone: "whatsapp" | "email" | "phone" | "instagram" | "facebook" | "maps" | "link";
  internal?: boolean;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 08…, +62 8…, 628…, wa.me/628… → 628… (null when it isn't a phone number) */
function phoneDigits(value: string) {
  const fromLink = /wa\.me\/(\d+)|phone=(\d+)/i.exec(value);
  let digits = fromLink ? fromLink[1] ?? fromLink[2] : value.replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  return /^\d{8,15}$/.test(digits) ? digits : null;
}

const httpsUrl = (v: string) => (/^https?:\/\/[^\s]+$/i.test(v) ? v : null);

function build(kind: Kind, value: string, label?: string, extra?: string): Button | null {
  switch (kind) {
    case "email":
      return EMAIL.test(value) ? { href: `mailto:${value}`, label: label || value, Icon: IconMail, tone: "email" } : null;
    case "whatsapp":
    case "wa": {
      const digits = phoneDigits(value);
      if (!digits) return null;
      const text = extra ? `?text=${encodeURIComponent(extra)}` : "";
      return { href: `https://wa.me/${digits}${text}`, label: label || "Chat WhatsApp", Icon: IconWhatsapp, tone: "whatsapp" };
    }
    case "telepon":
    case "telp": {
      const digits = phoneDigits(value);
      return digits ? { href: `tel:+${digits}`, label: label || value, Icon: IconPhone, tone: "phone" } : null;
    }
    case "instagram":
    case "ig": {
      const url = httpsUrl(value);
      if (url) return /instagram\.com/i.test(url) ? { href: url, label: label || "Instagram", Icon: IconInstagram, tone: "instagram" } : null;
      const user = value.replace(/^@/, "");
      return /^[A-Za-z0-9._]{1,30}$/.test(user)
        ? { href: `https://instagram.com/${user}`, label: label || `@${user}`, Icon: IconInstagram, tone: "instagram" }
        : null;
    }
    case "facebook":
    case "fb": {
      const url = httpsUrl(value);
      if (url) return /(facebook|fb)\.com/i.test(url) ? { href: url, label: label || "Facebook", Icon: IconFacebook, tone: "facebook" } : null;
      return /^[A-Za-z0-9.]{3,80}$/.test(value)
        ? { href: `https://facebook.com/${value}`, label: label || "Facebook", Icon: IconFacebook, tone: "facebook" }
        : null;
    }
    case "lokasi":
    case "maps": {
      const url = httpsUrl(value);
      return url ? { href: url, label: label || "Lihat Lokasi", Icon: IconMapPin, tone: "maps" } : null;
    }
    case "tombol":
    case "link": {
      if (/^\/(?!\/)\S*$/.test(value)) return { href: value, label: label || value, Icon: IconLink, tone: "link", internal: true };
      const url = httpsUrl(value);
      return url ? { href: url, label: label || url.replace(/^https?:\/\//i, ""), Icon: IconLink, tone: "link" } : null;
    }
  }
}

/** One template as a button, or null when the template can't be read */
export function parseTemplate(text: string): Button | null {
  const m = ONE_RE.exec(text.trim());
  if (!m) return null;
  const [value, label, extra] = m[2].split("|").map((p) => p.trim());
  return value ? build(m[1].toLowerCase() as Kind, value, label, extra) : null;
}

export function TemplateButton({ button }: { button: Button }) {
  const { href, label, Icon, tone, internal } = button;
  const className = `${styles.button} ${styles[tone]}`;
  const content = (
    <>
      <Icon aria-hidden />
      <span>{label}</span>
    </>
  );
  return internal ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <a href={href} className={className} {...(href.startsWith("http") && { target: "_blank", rel: "noreferrer" })}>
      {content}
    </a>
  );
}
