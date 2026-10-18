import { formatDate, formatTime } from "@/lib/format";
import type { EmailIssue } from "@/lib/types";
import { IconWarning } from "../Icons";
import local from "./EmailIssueNote.module.css";

export const EMAIL_ISSUE_LABEL: Record<EmailIssue, string> = {
  not_found: "Alamat email tidak ditemukan",
  mailbox_full: "Kotak masuk penerima penuh",
  rejected: "Ditolak server penerima",
  delayed: "Pengiriman tertunda",
  send_failed: "Gagal dikirim",
};

/** What staff can do about it */
const EMAIL_ISSUE_HINT: Record<EmailIssue, string> = {
  not_found: "Email verifikasi/OTP tidak sampai. Periksa ejaan alamat email atau minta pengguna memakai alamat lain.",
  mailbox_full: "Email verifikasi/OTP tidak sampai. Minta pengguna mengosongkan kotak masuknya, lalu kirim ulang.",
  rejected: "Server penerima menolak email kita. Minta pengguna memeriksa folder spam atau memakai alamat lain.",
  delayed: "Server penerima belum menerima email, pengiriman masih dicoba ulang.",
  send_failed: "Server email Trans Niaga gagal mengirim email ini. Coba kirim ulang nanti.",
};

/**
 * Note on an account whose emails did not arrive (found by the backend's bounce check), with the receiving
 * server's own words on hover / below. Renders nothing when there's no known problem.
 */
export function EmailIssueNote({
  issue,
  detail,
  at,
  full = false,
}: {
  issue?: EmailIssue | null;
  detail?: string | null;
  at?: string | null;
  /** Also show the advice and the server's message (detail views); otherwise only the label */
  full?: boolean;
}) {
  if (!issue) return null;
  const mild = issue === "delayed" || issue === "send_failed";
  const when = at ? `${formatDate(at)} ${formatTime(at)}` : "";
  return (
    <span className={`${local.note} ${mild ? local.mild : ""}`} title={[detail, when].filter(Boolean).join("\n")} role="note">
      <span className={local.head}>
        <IconWarning />
        <strong>{EMAIL_ISSUE_LABEL[issue]}</strong>
        {when && <span className={local.when}>{when}</span>}
      </span>
      {full && (
        <>
          <span>{EMAIL_ISSUE_HINT[issue]}</span>
          {detail && <code className={local.detail}>{detail}</code>}
        </>
      )}
    </span>
  );
}
