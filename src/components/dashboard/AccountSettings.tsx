"use client";

import { useEffect, useState } from "react";
import { api, ApiError, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fullName, imageSrc, splitName } from "@/lib/format";
import { IconLock, IconUser } from "../Icons";
import { Modal } from "../Modal";
import { useToast } from "../Toast";
import { PageHeader, PasswordInput, validateImage } from "../ui";
import styles from "./dashboard.module.css";
import local from "./AccountSettings.module.css";

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
  const [uploading, setUploading] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

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
    if (Object.keys(changes).length === 0) {
      toast.info("Tidak ada perubahan");
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      const { data } = await api.auth.updateMe(changes);
      setUser(data);
      toast.success("Perubahan disimpan");
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      toast.error("Gagal menyimpan", errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const changePhoto = async (file: File) => {
    const problem = validateImage(file);
    if (problem) return toast.error(problem);
    setUploading(true);
    try {
      const { data: image } = await api.images.upload(file, `Foto ${fullName(user)}`);
      const { data } = await api.auth.updateMe({ faceImageId: image.id });
      setUser(data);
      toast.success("Foto profil diperbarui");
    } catch (err) {
      toast.error("Gagal mengunggah foto", errorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <PageHeader title={title} />
      <div className={styles.splitCard}>
        <div className={styles.logoCard}>
          {user.faceImage ? (
            <img src={imageSrc(user.faceImage)} alt="Foto profil" />
          ) : (
            <span className={local.placeholder}>
              <IconUser />
            </span>
          )}
          <label className={`btn btn-navy btn-lg ${uploading ? local.disabled : ""}`}>
            {uploading ? "Mengunggah..." : "Ubah Foto"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              disabled={uploading}
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
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            {(errors.name || errors.firstName || errors.lastName) && (
              <span className="field-error">{errors.name || errors.firstName || errors.lastName}</span>
            )}
          </label>
          {isTenant && (
            <label className="field">
              <span className="label">Nama Usaha/Toko</span>
              <input className="input" value={tenantName} onChange={(e) => setTenantName(e.target.value)} />
              {errors.tenantName && <span className="field-error">{errors.tenantName}</span>}
            </label>
          )}
          <label className="field">
            <span className="label">Email</span>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>
          <label className="field">
            <span className="label">Nomor Telfon / Whatsapp</span>
            <input className="input" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            {errors.phoneNumber && <span className="field-error">{errors.phoneNumber}</span>}
          </label>
          <div className="field">
            <span className="label">Password</span>
            <div className={local.passwordRow}>
              <span>••••••••</span>
              <button type="button" className="btn btn-white btn-sm" onClick={() => setPwOpen(true)}>
                <IconLock /> Ubah Password
              </button>
            </div>
          </div>
          <div className={local.buttons}>
            <button type="submit" className="btn btn-green btn-lg" disabled={saving}>
              {saving ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}
            </button>
            <button type="button" className="btn btn-red btn-lg" onClick={reset} disabled={saving}>
              BATALKAN PERUBAHAN
            </button>
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
        {error && <div className="alert alert-error">{error}</div>}
        <button type="submit" className="btn btn-navy" disabled={busy}>
          {busy ? "Menyimpan..." : "Simpan Password"}
        </button>
      </form>
    </Modal>
  );
}
