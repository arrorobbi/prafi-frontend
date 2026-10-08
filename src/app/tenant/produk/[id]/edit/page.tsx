"use client";

import { useParams } from "next/navigation";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { IconWarning } from "@/components/Icons";
import { Loading, PageHeader, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { approvalReason, productStatus } from "@/lib/format";
import { useAsync } from "@/lib/useAsync";
import { Alert } from "@/components/shadcn/alert";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useAsync(() => api.products.get(id).then((r) => r.data), [id]);

  if (loading && !data) return <Loading />;
  if (error || !data)
    return (
      <>
        <PageHeader title="UBAH PRODUK" backHref="/tenant/produk" />
        <Alert variant="destructive">{error ?? "Produk tidak ditemukan"}</Alert>
      </>
    );

  const status = productStatus(data);
  const reason = approvalReason(data);

  return (
    <>
      <PageHeader title="UBAH PRODUK" backHref="/tenant/produk" />
      <div className="stack" style={{ marginBottom: 24 }}>
        <div>
          Status: <StatusBadge status={status} />
        </div>
        {(status === "rejected" || status === "inactive") && (
          <Alert variant="warning">
            <IconWarning />
            <span>
              {status === "rejected" ? "Produk ditolak" : "Produk dinonaktifkan"} administrator
              {reason ? (
                <>
                  {" "}
                  dengan alasan: <strong>{reason}</strong>
                </>
              ) : null}
              . Perbaiki data produk lalu simpan untuk mengajukan ulang.
            </span>
          </Alert>
        )}
      </div>
      <ProductForm key={data.id} product={data} />
    </>
  );
}
