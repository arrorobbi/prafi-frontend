import { ADMIN_CONTACT } from "@/lib/guides";

/** The administrator's WhatsApp and email ({{kontak-admin}} in a Panduan text), from the frontend .env. */
export function GuideContact() {
  const wa = ADMIN_CONTACT.whatsapp.replace(/\D/g, "");
  return (
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
  );
}
