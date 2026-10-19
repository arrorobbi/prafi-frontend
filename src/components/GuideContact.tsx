import { ADMIN_CONTACT } from "@/lib/guides";
import { parseTemplate, TemplateButton } from "./RichTextButton";

/** The administrator's WhatsApp and email as buttons ({{kontak-admin}} in a Panduan text), from the frontend .env. */
export function GuideContact() {
  const buttons = [
    ADMIN_CONTACT.whatsapp && parseTemplate(`{whatsapp: ${ADMIN_CONTACT.whatsapp} | WhatsApp ${ADMIN_CONTACT.whatsapp}}`),
    ADMIN_CONTACT.email && parseTemplate(`{email: ${ADMIN_CONTACT.email}}`),
  ].filter((b) => !!b);
  if (!buttons.length) return <p>Datang langsung ke kantor pengelola UMKM Kawasan Transmigrasi Prafi, Manokwari.</p>;
  return (
    <p>
      {buttons.map((b) => (
        <TemplateButton key={b.href} button={b} />
      ))}
    </p>
  );
}
