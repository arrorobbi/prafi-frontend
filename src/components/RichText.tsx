import { Fragment } from "react";

/** The default footer text, shown when the API can't be reached (the same as the backend's default). */
export const DEFAULT_FOOTER_ABOUT =
  "**UMKM TRANS NIAGA** dibangun dari semangat gotong royong untuk memajukan perekonomian lokal. Sebagai direktori dan marketplace UMKM di Prafi, Manokwari, platform ini dirancang untuk membina serta memperluas jangkauan pasar para pelaku usaha daerah. Melalui Trans Niaga, beli produk lokal kini jadi lebih praktis, sekaligus menjadi bentuk nyata dukungan kita terhadap kemajuan UMKM Prafi.";

/** One line with **bold** parts; everything else stays plain text (React escapes it, so no HTML gets through). */
function Line({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part) ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>,
  );
}

/**
 * Plain text written by staff ("Konten Situs"): an empty line starts a new paragraph, a single line break stays a
 * line break, and **text** is bold.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className={className}>
      {paragraphs.map((p, i) => (
        <p key={i}>
          {p.split("\n").map((line, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              <Line text={line} />
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}
