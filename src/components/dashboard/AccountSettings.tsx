"use client";

import { useEffect, useState } from "react";
import { api, ApiError, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fullName, imageSrc, splitName } from "@/lib/format";
import { IconLock, IconUser } from "../Icons";
import { Modal } from "../Modal";
import { useToast } from "../Toast";
import { PageHeader, PasswordInput, validateImage } from "../ui";
import { useLeaveGuard } from "../LeaveGuard";
import { usePendingImage } from "../UploadDialog";
import styles from "./dashboard.module.css";
import local from "./AccountSettings.module.css";
import { Button, buttonVariants } from "@/components/shadcn/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/shadcn/input";
import { Alert } from "@/components/shadcn/alert";

/** PATCH /api/auth/me — name, email, phone, photo (faceImageId), tenantName and password. */
export function AccountSettings({ title }: { title: string }) {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const photo = usePendingImage();
  const { confirmLeave } = useLeaveGuard();

  const reset = () => {
    if (!user) return;
    setName(fullName(user));
    setEmail(user.email);
    setPhone(user.phoneNumber);
    setTenantName(user.tenantName ?? "");
    setErrors({});
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reset, [user?.id]);

  if (!user) return null;
  const isTenant = user.role === "tenant";

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const changes: Parameters<typeof api.auth.updateMe>[0] = {};
    const { firstName, lastName } = splitName(name);
    if (!name.trim()) return setErrors({ name: "Nama wajib diisi" });
    if (firstName !== user.firstName) changes.firstName = firstName;
    if (lastName !== user.lastName) changes.lastName = lastName;
    if (email.trim() !== user.email) changes.email = email.trim();
    if (phone.trim() !== user.phoneNumber) changes.phoneNumber = phone.trim();
    if (isTenant && tenantName.trim() !== (user.tenantName ?? "")) changes.tenantName = tenantName.trim();
    // The new photo is only attached now, with Simpan
    const newPhoto = photo.pending;
    if (newPhoto) changes.faceImageId = newPhoto.id;
    if (Object.keys(changes).length === 0) {
      toast.info("Tidak ada perubahan");
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      const { data } = await api.auth.updateMe(changes);
      setUser(data);
      if (newPhoto) photo.saved(data.faceImageId === newPhoto.id && !!data.faceImage);
      else toast.success("Perubahan disimpan");
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      toast.error("Gagal menyimpan", errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const changePhoto = (file: File) => {
    const problem = validateImage(file);
    if (problem) return photo.showError("Foto tidak dapat dipakai", problem);
    void photo.pick(file, `Foto ${fullName(user)}`);
  };

  /** Batalkan Perubahan: an unsaved photo is deleted, so ask first */
  const cancel = () =>
    confirmLeave(() => {
      reset();
    }, "Batalkan perubahan?");

  return (
    <>
      <PageHeader title={title} />
      {photo.dialog}
      <div className={styles.splitCard}>
        <div className={styles.logoCard}>
          {photo.previewUrl || user.faceImage ? (
            <img src={photo.previewUrl ?? imageSrc(user.faceImage)} alt="Foto profil" />
          ) : (
            <span className={local.placeholder}>
              <IconUser />
            </span>
          )}
          {photo.pending && <span className={local.pendingNote}>Foto baru belum disimpan. Klik Simpan Perubahan.</span>}
          {isTenant && !user.faceImageId && !photo.pending && (
            <span className={local.pendingNote}>Unggah foto profil agar Anda dapat menambahkan produk.</span>
          )}
          <label className={cn(buttonVariants({ variant: "navy", size: "lg" }), "cursor-pointer", photo.uploading && local.disabled)}>
            {photo.uploading ? "Mengunggah..." : "Ubah Foto"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              disabled={photo.uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) changePhoto(f);
              }}
            />
          </label>
        </div>

        <form className="stack" onSubmit={save}>
          <label className="field">
            <span className="label">Nama Akun</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            {(errors.name || errors.firstName || errors.lastName) && (
              <span className="field-error">{errors.name || errors.firstName || errors.lastName}</span>
            )}
          </label>
          {isTenant && (
            <label className="field">
              <span className="label">Nama Usaha/Toko</span>
              <Input value={tenantName} onChange={(e) => setTenantName(e.target.value)} />
              {errors.tenantName && <span className="field-error">{errors.tenantName}</span>}
            </label>
          )}
          <label className="field">
            <span className="label">Email</span>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>
          <label className="field">
            <span className="label">Nomor Telfon / Whatsapp</span>
            <Input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            {errors.phoneNumber && <span className="field-error">{errors.phoneNumber}</span>}
          </label>
          <div className="field">
            <span className="label">Password</span>
            <div className={local.passwordRow}>
              <span>••••••••</span>
              <Button type="button" variant="white" size="sm" onClick={() => setPwOpen(true)}>
                <IconLock /> Ubah Password
              </Button>
            </div>
          </div>
          <div className={local.buttons}>
            <Button type="submit" variant="green" size="lg" disabled={saving}>
              {saving ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}
            </Button>
            <Button type="button" variant="red" size="lg" onClick={cancel} disabled={saving}>
              BATALKAN PERUBAHAN
            </Button>
          </div>
        </form>
      </div>

      <ChangePassword open={pwOpen} onClose={() => setPwOpen(false)} />
    </>
  );
}

function ChangePassword({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const { setUser } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return setError("Password baru minimal 8 karakter");
    if (next !== confirm) return setError("Konfirmasi password tidak sama");
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.auth.updateMe({ password: next, currentPassword: current });
      setUser(data);
      toast.success("Password berhasil diubah");
      close();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title="Ubah Password" onClose={close}>
      <form className="stack" onSubmit={submit}>
        <label className="field">
          <span className="label">Password Saat Ini</span>
          <PasswordInput value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
        </label>
        <label className="field">
          <span className="label">Password Baru</span>
          <PasswordInput placeholder="Min. 8 karakter" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
        </label>
        <label className="field">
          <span className="label">Konfirmasi Ulang</span>
          <PasswordInput placeholder="Min. 8 karakter" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </label>
        {error && <Alert variant="destructive">{error}</Alert>}
        <Button type="submit" variant="navy" disabled={busy}>
          {busy ? "Menyimpan..." : "Simpan Password"}
        </Button>
      </form>
    </Modal>
  );
}
