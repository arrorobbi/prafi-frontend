import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconDocs, IconHeart, IconStore, IconThumb } from "@/components/Icons";
import { ProductStrip } from "@/components/site/ProductStrip";
import { PageHeader, Thumb } from "@/components/ui";
import { formatDate, formatNumber, imageSrc, sellerName } from "@/lib/format";
import { getAllLandingProducts } from "@/lib/server-api";
import styles from "./detail.module.css";

type Props = { params: Promise<{ id: string }> };

async function findProduct(id: string) {
  const { products } = await getAllLandingProducts();
  return { product: products.find((p) => p.id === id), products };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product } = await findProduct((await params).id);
  return product ? { title: product.name, description: product.description } : { title: "Produk" };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const { product, products } = await findProduct(id);
  if (!product) notFound();

  const fromSeller = products.filter((p) => p.tenant?.id === product.tenant?.id && p.id !== product.id);
  const others = fromSeller.length ? fromSeller : products.filter((p) => p.id !== product.id).slice(0, 12);

  return (
    <div className={styles.page}>
      <PageHeader title="INFORMASI PRODUK" backHref="/produk" />

      <div className={styles.layout}>
        <div className={styles.photo}>
          <Thumb src={imageSrc(product.image)} alt={product.image?.altText || product.name} />
        </div>

        <div className={styles.info}>
          <p className={styles.kicker}>{sellerName(product)}</p>
          <div className={`card ${styles.main}`}>
            <div className={styles.mainLeft}>
              <h1>{product.name}</h1>
              <p className={styles.stock}>Stok {formatNumber(product.qty)}</p>
              <ul className={styles.perks}>
                <li>
                  <IconThumb /> REKOMENDASI TERBAIK
                </li>
                <li>
                  <IconDocs /> PRODUK TERJAMIN
                </li>
                <li>
                  <IconHeart /> DIBUAT SEPENUH HATI
                </li>
              </ul>
            </div>
            <div className={styles.mainRight}>
              <h2>Deskripsi</h2>
              <p>{product.description}</p>
              <h2>Informasi Produk</h2>
              <p>{product.details}</p>
            </div>
          </div>

          <div className={styles.bottom}>
            {product.tenant && (
              <Link href={`/umkm/${product.tenant.id}`} className={`card ${styles.seller}`}>
                <IconStore />
                <div>
                  <strong>{sellerName(product)}</strong>
                  <span>Lihat semua produk dari UMKM ini</span>
                </div>
              </Link>
            )}
            <p className={styles.since}>Tayang sejak {formatDate(product.createdAt)}</p>
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <section className={styles.more}>
          <h2>{fromSeller.length ? "PRODUK LAIN DARI UMKM INI" : "PRODUK REKOMENDASI LAINNYA"}</h2>
          <ProductStrip products={others} />
        </section>
      )}
    </div>
  );
}
