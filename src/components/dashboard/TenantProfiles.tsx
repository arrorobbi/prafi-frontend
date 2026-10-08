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
import { Button, buttonVariants } from "@/components/shadcn/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/table";
import { Alert } from "@/components/shadcn/alert";

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
        <Alert variant="destructive">{error}</Alert>
      ) : data!.data.length === 0 ? (
        <EmptyState title="Belum ada profil toko">Penjual membuat profil toko dari dashboard mereka.</EmptyState>
      ) : (
        <>
          <div className="table-wrap">
            <Table className="table">
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Nama Toko</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Wilayah</TableHead>
                  <TableHead>Pemilik</TableHead>
                  <TableHead className="col-actions">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.data.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell data-label="">
                      <Thumb src={imageSrc(t.logo)} alt={t.name} className="thumb" />
                    </TableCell>
                    <TableCell data-label="Nama Toko">{t.name}</TableCell>
                    <TableCell data-label="Kategori">{t.category?.name ?? "-"}</TableCell>
                    <TableCell data-label="Wilayah">{t.area}</TableCell>
                    <TableCell data-label="Pemilik">{fullName(t.owner)}</TableCell>
                    <TableCell data-label="">
                      <Button type="button" variant="blue" size="sm" onClick={() => setDetail(t)}>
                        Lihat Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                <a href={detail.whatsappLink} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "green", size: "sm" })}>
                  <IconWhatsapp /> WhatsApp
                </a>
              )}
              {isLink(detail.gmapsLink) && (
                <a href={detail.gmapsLink} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "navy", size: "sm" })}>
                  <IconMapPin /> Lokasi
                </a>
              )}
              {isLink(detail.fbLink) && (
                <a href={detail.fbLink} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "light", size: "sm" })}>
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
