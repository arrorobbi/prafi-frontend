"use client";

import { useState } from "react";
import styles from "@/components/dashboard/dashboard.module.css";
import { IconFacebook, IconGoogle, IconInstagram, IconMapPin, IconPencil, IconShopee, IconWarning, IconWhatsapp } from "@/components/Icons";
import { PROFILE_FIELD_LABEL } from "@/components/dashboard/ProductForm";
import { ConfirmDialog } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { Loading, PageHeader, Thumb } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { imageSrc, tenantWhatsappText, whatsappWithText } from "@/lib/format";
import { useTenantProfile } from "@/lib/tenantProfile";
import { ProfileForm } from "./ProfileForm";
import local from "./profil.module.css";
import { Button, buttonVariants } from "@/components/shadcn/button";
import { Alert } from "@/components/shadcn/alert";

const isLink = (v?: string | null) => !!v && v !== "-";

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
          <Alert variant="info" style={{ marginBottom: 24 }}>
            Lengkapi profil toko Anda. Data ini membantu administrator memverifikasi usaha Anda dan membantu pembeli
            menghubungi Anda.
          </Alert>
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

  // The account photo is set in Pengaturan Akun, not here
  const missingProfile = (profile.missingFields ?? []).filter((f) => f !== "faceImageId");

  return (
    <>
      <PageHeader title="PROFIL UMKM" />
      {profile.isComplete === false && (
        <Alert variant="warning" className="mt">
          <IconWarning />
          <span>
            Profil belum lengkap
            {missingProfile.length > 0 && <>: {missingProfile.map((f) => PROFILE_FIELD_LABEL[f] ?? f).join(", ")}</>}. Lengkapi melalui{" "}
            <strong>Ubah Profil</strong> agar dapat menambahkan produk baru.
          </span>
        </Alert>
      )}
      <div className={styles.splitCard}>
        <div className={styles.logoCard}>
          <Thumb src={imageSrc(profile.logo)} alt={`Logo ${profile.name}`} />
          <Button type="button" variant="navy" onClick={() => setEditing(true)}>
            <IconPencil /> Ubah Profil
          </Button>
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
          <div className="field">
            <span className="label">Wilayah</span>
            <div className={styles.readonlyBox}>{profile.area}</div>
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
          <a
            href={whatsappWithText(profile.whatsappLink, tenantWhatsappText(profile))}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "green", size: "lg" })}
          >
            <IconWhatsapp /> HUBUNGI PENJUAL
          </a>
        )}
        {isLink(profile.gmapsLink) && (
          <a href={profile.gmapsLink} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "navy", size: "lg" })}>
            <IconMapPin /> CEK LOKASI UMKM
          </a>
        )}
        {isLink(profile.fbLink) && (
          <a href={profile.fbLink} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "orange", size: "lg" })}>
            <IconFacebook /> KUNJUNGI TOKO
          </a>
        )}
        {isLink(profile.instagramLink) && (
          <a href={profile.instagramLink!} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "navy", size: "lg" })}>
            <IconInstagram /> INSTAGRAM
          </a>
        )}
        {isLink(profile.googleBusinessLink) && (
          <a href={profile.googleBusinessLink!} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "blue", size: "lg" })}>
            <IconGoogle /> GOOGLE BISNIS
          </a>
        )}
        {isLink(profile.shopeeLink) && (
          <a href={profile.shopeeLink!} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "orange", size: "lg" })}>
            <IconShopee /> SHOPEE
          </a>
        )}
      </div>

      <div className={local.danger}>
        <Button type="button" variant="light" size="sm" onClick={() => setDeleting(true)}>
          Hapus profil toko
        </Button>
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
