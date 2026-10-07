"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { fullName, imageSrc } from "@/lib/format";
import type { TenantProfile } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { IconFacebook, IconMapPin, IconWhatsapp } from "../Icons";
import { Modal } from "../Modal";
import { EmptyState, Loading, Pagination, Thumb } from "../ui";
import styles from "./dashboard.module.css";
import local from "./TenantProfiles.module.css";

const LIMIT = 10;
const isLink = (v?: string) => !!v && v !== "-";

/** Every shop profile, read-only (GET /api/tenants — superadmin, disnakertrans, admin). */
export function TenantProfiles() {
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<TenantProfile | null>(null);
  const { data, loading, error } = useAsync(() => api.tenants.list({ page, limit: LIMIT }), [page]);

  return (
    <div className={styles.panel}>
      {loading && !data ? (
        <Loading />
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : data!.data.length === 0 ? (
        <EmptyState title="Belum ada profil toko">Penjual membuat profil toko dari dashboard mereka.</EmptyState>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Logo</th>
                  <th>Nama Toko</th>
                  <th>Kategori</th>
                  <th>Wilayah</th>
                  <th>Pemilik</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data!.data.map((t) => (
                  <tr key={t.id}>
                    <td data-label="">
                      <Thumb src={imageSrc(t.logo)} alt={t.name} className="thumb" />
                    </td>
                    <td data-label="Nama Toko">{t.name}</td>
                    <td data-label="Kategori">{t.category?.name ?? "-"}</td>
                    <td data-label="Wilayah">{t.area}</td>
                    <td data-label="Pemilik">{fullName(t.owner)}</td>
                    <td data-label="">
                      <button type="button" className="btn btn-blue btn-sm" onClick={() => setDetail(t)}>
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={data!.meta?.totalPages ?? 1}
            total={data!.meta?.total ?? data!.data.length}
            shown={data!.data.length}
            noun="toko"
            onChange={setPage}
          />
        </>
      )}

      <Modal open={!!detail} title={detail?.name ?? ""} onClose={() => setDetail(null)} wide>
        {detail && (
          <div className={local.detail}>
            <Thumb src={imageSrc(detail.logo)} alt={detail.name} className={local.logo} />
            <dl>
              <dt>Kategori</dt>
              <dd>{detail.category?.name ?? "-"}</dd>
              <dt>Wilayah</dt>
              <dd>{detail.area}</dd>
              <dt>Alamat</dt>
              <dd>{detail.address}</dd>
              <dt>Jam Operasional</dt>
              <dd>{detail.operationalHours}</dd>
              <dt>Deskripsi</dt>
              <dd>{detail.description}</dd>
              <dt>Pemilik</dt>
              <dd>
                {fullName(detail.owner)} · {detail.owner?.email}
              </dd>
            </dl>
            <div className={local.links}>
              {isLink(detail.whatsappLink) && (
                <a href={detail.whatsappLink} target="_blank" rel="noreferrer" className="btn btn-green btn-sm">
                  <IconWhatsapp /> WhatsApp
                </a>
              )}
              {isLink(detail.gmapsLink) && (
                <a href={detail.gmapsLink} target="_blank" rel="noreferrer" className="btn btn-navy btn-sm">
                  <IconMapPin /> Lokasi
                </a>
              )}
              {isLink(detail.fbLink) && (
                <a href={detail.fbLink} target="_blank" rel="noreferrer" className="btn btn-light btn-sm">
                  <IconFacebook /> Facebook
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
