"use client";

import { useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { formatDate, fullName, imageSrc } from "@/lib/format";
import type { User } from "@/lib/types";
import { IconPencil } from "../Icons";
import { Modal } from "../Modal";
import { useToast } from "../Toast";
import { Thumb } from "../ui";
import { EmailIssueNote } from "./EmailIssueNote";
import styles from "./dashboard.module.css";
import local from "./SellerDetail.module.css";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Badge } from "@/components/shadcn/badge";
import { Alert } from "@/components/shadcn/alert";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * A seller's account and shop data for the admin ("Manajemen UMKM"): face photo, name, email, phone, store name and
 * address. Only the email can be changed (PATCH /api/users/:id/email): the seller then verifies the new address
 * with an OTP before logging in again.
 */
export function SellerDetail({ user, onClose, onChanged }: { user: User | null; onClose: () => void; onChanged: (u: User) => void }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    setEditing(false);
    setFieldError(null);
    setEmail(user?.email ?? "");
  }, [user?.id, user?.email]);

  const save = async () => {
    if (!user) return;
    const next = email.trim().toLowerCase();
    if (!EMAIL_RE.test(next)) return setFieldError("Masukkan alamat email yang valid");
    if (next === user.email) return setFieldError("Email baru sama dengan email saat ini");
    setBusy(true);
    setFieldError(null);
    try {
      const { data } = await api.users.changeEmail(user.id, next);
      toast.success(
        "Email penjual diubah",
        data.verification.emailSent
          ? `Kode OTP dikirim ke ${data.user.email}. Penjual harus memverifikasinya sebelum dapat login kembali.`
          : `Kode OTP gagal dikirim ke ${data.user.email}; penjual dapat meminta kode baru saat login.`,
      );
      setEditing(false);
      onChanged(data.user);
    } catch (err) {
      setFieldError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const tenant = user?.tenant;
  return (
    <Modal open={!!user} title={user ? tenant?.name || user.tenantName || fullName(user) : ""} onClose={onClose} wide>
      {user && (
        <div className={styles.detailGrid}>
          <div className={local.photos}>
            <figure>
              <Thumb zoom src={imageSrc(user.faceImage)} alt={`Foto ${fullName(user)}`} className={local.face} />
              <figcaption>Foto Pemilik</figcaption>
            </figure>
            {tenant?.logo && (
              <figure>
                <Thumb zoom src={imageSrc(tenant.logo)} alt={`Logo ${tenant.name}`} className={local.logo} />
                <figcaption>Logo Toko</figcaption>
              </figure>
            )}
          </div>
          <dl className={styles.detailList}>
            <dt className="label">Nama Pemilik</dt>
            <dd>{fullName(user)}</dd>
            <dt className="label">Email</dt>
            <dd>
              {editing ? (
                <div className={local.emailForm}>
                  <Input
                    type="email"
                    value={email}
                    autoFocus
                    maxLength={255}
                    aria-invalid={!!fieldError || undefined}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && save()}
                  />
                  {fieldError && <span className="field-error">{fieldError}</span>}
                  <Alert variant="warning">
                    Penjual akan keluar dari semua sesi dan harus memverifikasi email baru dengan kode OTP sebelum dapat login kembali.
                    Email lama akan menerima pemberitahuan perubahan ini.
                  </Alert>
                  <div className={local.emailActions}>
                    <Button type="button" variant="light" size="sm" disabled={busy} onClick={() => setEditing(false)}>
                      Batal
                    </Button>
                    <Button type="button" size="sm" disabled={busy} onClick={save}>
                      {busy ? "Menyimpan..." : "Simpan Email"}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <span className={local.emailRow}>
                    <span className={styles.wrap}>{user.email}</span>
                    <Badge variant={user.mailActive ? "active" : "pending"}>{user.mailActive ? "Terverifikasi" : "Belum Verifikasi"}</Badge>
                    {user.role === "tenant" && (
                      <Button type="button" variant="blue" size="sm" onClick={() => setEditing(true)}>
                        <IconPencil /> Ubah Email
                      </Button>
                    )}
                  </span>
                  <EmailIssueNote issue={user.emailIssue} detail={user.emailIssueDetail} at={user.emailIssueAt} full />
                </>
              )}
            </dd>
            <dt className="label">Nomor Telepon</dt>
            <dd>{user.phoneNumber}</dd>
            <dt className="label">Nama Toko</dt>
            <dd>{tenant?.name || user.tenantName || "-"}</dd>
            <dt className="label">Alamat Toko</dt>
            <dd>{tenant ? `${tenant.address}${tenant.area ? ` (${tenant.area})` : ""}` : "Penjual belum membuat profil toko"}</dd>
            <dt className="label">Terdaftar</dt>
            <dd>{formatDate(user.createdAt)}</dd>
          </dl>
        </div>
      )}
    </Modal>
  );
}
