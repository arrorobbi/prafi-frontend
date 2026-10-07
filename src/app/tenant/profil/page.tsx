"use client";

import { useState } from "react";
import styles from "@/components/dashboard/dashboard.module.css";
import { IconFacebook, IconInstagram, IconMapPin, IconPencil, IconWarning, IconWhatsapp } from "@/components/Icons";
import { ConfirmDialog } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { Loading, PageHeader, Thumb } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { imageSrc } from "@/lib/format";
import { useTenantProfile } from "@/lib/tenantProfile";
import { ProfileForm } from "./ProfileForm";
import local from "./profil.module.css";

const isLink = (v?: string) => !!v && v !== "-";

export default function ShopProfilePage() {
  const toast = useToast();
  const { profile, loading, setProfile } = useTenantProfile();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;

  if (!profile || editing) {
    return (
      <>
        <PageHeader title={profile ? "UBAH PROFIL UMKM" : "BUAT PROFIL UMKM"} />
        {!profile && (
          <div className="alert alert-info" style={{ marginBottom: 24 }}>
            Lengkapi profil toko Anda. Data ini membantu administrator memverifikasi usaha Anda dan membantu pembeli
            menghubungi Anda.
          </div>
        )}
        <ProfileForm
          profile={profile}
          onCancel={profile ? () => setEditing(false) : undefined}
          onSaved={(p) => {
            setProfile(p);
            setEditing(false);
          }}
        />
      </>
    );
  }

  const remove = async () => {
    setBusy(true);
    try {
      await api.tenants.deleteMine();
      setProfile(null);
      toast.success("Profil toko dihapus");
    } catch (err) {
      toast.error("Gagal menghapus profil", errorMessage(err));
    } finally {
      setBusy(false);
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader title="PROFIL UMKM" />
      {profile.isComplete === false && (
        <div className="alert alert-warning mt">
          <IconWarning />
          <span>
            Profil belum lengkap{profile.missingFields?.includes("instagramLink") ? ": tautan Instagram belum diisi" : ""}. Lengkapi melalui{" "}
            <strong>Ubah Profil</strong> agar dapat menambahkan produk baru.
          </span>
        </div>
      )}
      <div className={styles.splitCard}>
        <div className={styles.logoCard}>
          <Thumb src={imageSrc(profile.logo)} alt={`Logo ${profile.name}`} />
          <button type="button" className="btn btn-navy" onClick={() => setEditing(true)}>
            <IconPencil /> Ubah Profil
          </button>
        </div>
        <div className="stack">
          <div className="field">
            <span className="label">Nama Usaha/Toko</span>
            <div className={styles.readonlyBox}>{profile.name}</div>
          </div>
          <div className="field">
            <span className="label">Deskripsi Usaha/Toko</span>
            <div className={styles.readonlyBox}>{profile.description}</div>
          </div>
          <div className={styles.formGrid}>
            <div className="field">
              <span className="label">Kategori</span>
              <div className={styles.readonlyBox}>{profile.category?.name ?? "-"}</div>
            </div>
            <div className="field">
              <span className="label">Wilayah</span>
              <div className={styles.readonlyBox}>{profile.area}</div>
            </div>
          </div>
          <div className="field">
            <span className="label">Jam Operasional</span>
            <div className={styles.readonlyBox}>{profile.operationalHours}</div>
          </div>
        </div>
      </div>

      <div className={`field ${local.address}`}>
        <span className="label">Alamat Usaha/Toko</span>
        <div className={styles.readonlyBox}>{profile.address}</div>
      </div>

      <div className={`${styles.linkRow} mt`}>
        {isLink(profile.whatsappLink) && (
          <a href={profile.whatsappLink} target="_blank" rel="noreferrer" className="btn btn-green btn-lg">
            <IconWhatsapp /> HUBUNGI PENJUAL
          </a>
        )}
        {isLink(profile.gmapsLink) && (
          <a href={profile.gmapsLink} target="_blank" rel="noreferrer" className="btn btn-navy btn-lg">
            <IconMapPin /> CEK LOKASI UMKM
          </a>
        )}
        {isLink(profile.fbLink) && (
          <a href={profile.fbLink} target="_blank" rel="noreferrer" className="btn btn-orange btn-lg">
            <IconFacebook /> KUNJUNGI TOKO
          </a>
        )}
        {isLink(profile.instagramLink) && (
          <a href={profile.instagramLink} target="_blank" rel="noreferrer" className="btn btn-navy btn-lg">
            <IconInstagram /> INSTAGRAM
          </a>
        )}
      </div>

      <div className={local.danger}>
        <button type="button" className="btn btn-light btn-sm" onClick={() => setDeleting(true)}>
          Hapus profil toko
        </button>
      </div>

      <ConfirmDialog
        open={deleting}
        title="Hapus Profil Toko"
        danger
        busy={busy}
        confirmLabel="Hapus Profil"
        message="Profil toko dan logonya akan dihapus. Akun dan produk Anda tetap ada. Lanjutkan?"
        onConfirm={remove}
        onClose={() => setDeleting(false)}
      />
    </>
  );
}
