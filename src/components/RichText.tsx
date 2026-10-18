import Link from "next/link";
import { Fragment } from "react";

/** The default footer text, shown when the API can't be reached (the same as the backend's default). */
export const DEFAULT_FOOTER_ABOUT =
  "**UMKM TRANS NIAGA** dibangun dari semangat gotong royong untuk memajukan perekonomian lokal. Sebagai direktori dan marketplace UMKM di Prafi, Manokwari, platform ini dirancang untuk membina serta memperluas jangkauan pasar para pelaku usaha daerah. Melalui Trans Niaga, beli produk lokal kini jadi lebih praktis, sekaligus menjadi bentuk nyata dukungan kita terhadap kemajuan UMKM Prafi.";

const INLINE = /(\*\*[^*]+\*\*|\[[^\]\n]+\]\([^)\s]+\))/g;

/** Only addresses that can't run anything: a page of this site, or http(s) / mailto / tel */
const safeHref = (href: string) => (/^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(href) ? href : null);

/** One line with **bold** parts and [links](/path); everything else stays plain text (React escapes it). */
function Line({ text }: { text: string }) {
  return text.split(INLINE).map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    const href = link && safeHref(link[2]);
    if (link && href) {
      return href.startsWith("/") || href.startsWith("#") ? (
        <Link key={i} href={href}>
          {link[1]}
        </Link>
      ) : (
        <a key={i} href={href} target="_blank" rel="noreferrer">
          {link[1]}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** Lines of one block: runs of "- " lines become a list, the other lines a paragraph (single breaks kept). */
function Block({ lines }: { lines: string[] }) {
  const groups: { list: boolean; lines: string[] }[] = [];
  for (const line of lines) {
    const list = /^[-*]\s+/.test(line);
    const last = groups[groups.length - 1];
    if (last && last.list === list) last.lines.push(list ? line.replace(/^[-*]\s+/, "") : line);
    else groups.push({ list, lines: [list ? line.replace(/^[-*]\s+/, "") : line] });
  }
  return groups.map((g, i) =>
    g.list ? (
      <ul key={i}>
        {g.lines.map((l, j) => (
          <li key={j}>
            <Line text={l} />
          </li>
        ))}
      </ul>
    ) : (
      <p key={i}>
        {g.lines.map((l, j) => (
          <Fragment key={j}>
            {j > 0 && <br />}
            <Line text={l} />
          </Fragment>
        ))}
      </p>
    ),
  );
}

/**
 * Plain text written by staff ("Konten Situs", "Kelola Panduan"): an empty line starts a new paragraph, a single line
 * break stays a line break, lines starting with "- " make a list, **text** is bold and [label](/path) is a link.
 * `tokens`: a paragraph that is exactly e.g. {{kontak-admin}} is replaced by that element.
 */
export function RichText({ text, className, tokens }: { text: string; className?: string; tokens?: Record<string, React.ReactNode> }) {
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.split("\n").map((l) => l.trim()).filter(Boolean))
    .filter((b) => b.length);
  return (
    <div className={className}>
      {blocks.map((lines, i) => {
        const token = lines.length === 1 ? /^\{\{([a-z-]+)\}\}$/.exec(lines[0])?.[1] : undefined;
        if (token && tokens && token in tokens) return <Fragment key={i}>{tokens[token]}</Fragment>;
        return <Block key={i} lines={lines} />;
      })}
    </div>
  );
}
