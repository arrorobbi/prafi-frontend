"use client";

import { RatingSummary } from "../Stars";
import Link from "next/link";
import { useMemo, useState } from "react";
import { api, fetchAll } from "@/lib/api";
import {
  approvalReason,
  formatDate,
  formatRupiah,
  formatTime,
  imageSrc,
  productStatus,
  sellerName,
  type ProductStatus,
} from "@/lib/format";
import type { Product } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { IconSearch } from "../Icons";
import { Modal } from "../Modal";
import { EmptyState, Loading, Pagination, StatusBadge, Thumb } from "../ui";
import styles from "./dashboard.module.css";

const PER_PAGE = 10;
const TABS: [ProductStatus | "all", string][] = [
  ["all", "Semua Produk"],
  ["active", "Produk Aktif"],
  ["pending", "Menunggu"],
  ["rejected", "Produk Ditolak"],
  ["inactive", "Produk Dinonaktifkan"],
];

/**
 * Every product (GET /api/products) with status tabs, search and category/seller filters.
 * `detailHref` links each row to a page (admin review); without it the row opens a read-only detail.
 */
export function ProductBrowser({ detailHref }: { detailHref?: (p: Product) => string }) {
  const [tab, setTab] = useState<ProductStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [seller, setSeller] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Product | null>(null);

  const { data, loading, error } = useAsync(async () => {
    const [products, tenants] = await Promise.all([
      fetchAll((p) => api.products.list({ page: p, limit: 100 })),
      fetchAll((p) => api.tenants.list({ page: p, limit: 100 })),
    ]);
    return { products, tenants };
  }, []);

  const categoryByOwner = useMemo(
    () => new Map((data?.tenants ?? []).map((t) => [t.userId, t.category?.name ?? ""])),
    [data],
  );
  const categories = useMemo(() => [...new Set([...categoryByOwner.values()].filter(Boolean))].sort(), [categoryByOwner]);
  const sellers = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of data?.products ?? []) map.set(p.tenantId, sellerName(p));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [data]);

  const q = query.trim().toLowerCase();
  const list = (data?.products ?? []).filter(
    (p) =>
      (tab === "all" || productStatus(p) === tab) &&
      (!q || p.name.toLowerCase().includes(q) || sellerName(p).toLowerCase().includes(q)) &&
      (!category || categoryByOwner.get(p.tenantId) === category) &&
      (!seller || p.tenantId === seller),
  );
  const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const shown = list.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };

  return (
    <>
      <div className={styles.tabs}>
        {TABS.map(([key, label]) => (
          <button key={key} type="button" className={tab === key ? styles.tabActive : ""} onClick={() => reset(setTab)(key)}>
            {label}
          </button>
        ))}
      </div>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span className="sr-only">Cari produk</span>
          <input placeholder="Cari produk" value={query} onChange={(e) => reset(setQuery)(e.target.value)} />
          <IconSearch />
        </label>
        <span className={styles.toolbarSpacer} />
        <select className={styles.filter} value={category} onChange={(e) => reset(setCategory)(e.target.value)} aria-label="Kategori">
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select className={styles.filter} value={seller} onChange={(e) => reset(setSeller)(e.target.value)} aria-label="Penjual">
          <option value="">Semua Penjual</option>
          {sellers.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.panel}>
        {loading && !data ? (
          <Loading />
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : list.length === 0 ? (
          <EmptyState title="Tidak ada produk">Ubah filter atau kata kunci pencarian.</EmptyState>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Nama Produk</th>
                    <th>Nama Penjual</th>
                    <th>Kategori</th>
                    <th>Tanggal Pengajuan</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((p) => (
                    <tr key={p.id}>
                      <td data-label="">
                        <Thumb src={imageSrc(p.image)} alt={p.name} className="thumb" />
                      </td>
                      <td data-label="Nama Produk">{p.name}</td>
                      <td data-label="Nama Penjual">{sellerName(p)}</td>
                      <td data-label="Kategori">{categoryByOwner.get(p.tenantId) || "-"}</td>
                      <td data-label="Tanggal">
                        {formatDate(p.createdAt)}
                        <br />
                        {formatTime(p.createdAt)}
                      </td>
                      <td data-label="Status">
                        <StatusBadge status={productStatus(p)} />
                      </td>
                      <td data-label="">
                        {detailHref ? (
                          <Link href={detailHref(p)} className="btn btn-blue btn-sm">
                            Lihat Detail
                          </Link>
                        ) : (
                          <button type="button" className="btn btn-blue btn-sm" onClick={() => setDetail(p)}>
                            Lihat Detail
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={current} totalPages={totalPages} total={list.length} shown={shown.length} onChange={setPage} />
          </>
        )}
      </div>

      <Modal open={!!detail} title={detail?.name ?? ""} onClose={() => setDetail(null)} wide>
        {detail && <ProductDetail product={detail} category={categoryByOwner.get(detail.tenantId)} />}
      </Modal>
    </>
  );
}

/** Read-only product facts (superadmin and disnakertrans cannot approve products). */
function ProductDetail({ product, category }: { product: Product; category?: string }) {
  const status = productStatus(product);
  const reason = approvalReason(product);
  return (
    <div className={styles.detailGrid}>
      <Thumb src={imageSrc(product.image)} alt={product.name} className={styles.detailImg} />
      <dl className={styles.detailList}>
        <div>
          <dt className="label">Status</dt>
          <dd>
            <StatusBadge status={status} />
            {reason && <span className="muted"> — {reason}</span>}
          </dd>
        </div>
        <div>
          <dt className="label">Deskripsi</dt>
          <dd>{product.description}</dd>
        </div>
        <div>
          <dt className="label">Informasi Produk</dt>
          <dd>{product.details}</dd>
        </div>
        <div>
          <dt className="label">Harga</dt>
          <dd>{formatRupiah(product.price)}</dd>
        </div>
        <div>
          <dt className="label">Rekomendasi Penjual</dt>
          <dd>{product.isRecommended ? "Ya, tampil di rekomendasi" : "Tidak"}</dd>
        </div>
        <div>
          <dt className="label">Ulasan</dt>
          <dd>
            <RatingSummary average={product.ratingAverage} count={product.reviewCount} />
          </dd>
        </div>
        <div>
          <dt className="label">Penjual</dt>
          <dd>
            {sellerName(product)}
            {product.tenant?.email ? ` · ${product.tenant.email}` : ""}
          </dd>
        </div>
        <div>
          <dt className="label">Kategori UMKM</dt>
          <dd>{category || "-"}</dd>
        </div>
        <div>
          <dt className="label">Diajukan</dt>
          <dd>
            {formatDate(product.createdAt)} {formatTime(product.createdAt)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
