import Link from "next/link";
import { formatRupiah, imageSrc, sellerName } from "@/lib/format";
import type { Product } from "@/lib/types";
import { IconBox, IconStore } from "../Icons";
import { RatingSummary } from "../Stars";
import { Thumb } from "../ui";
import styles from "./ProductRow.module.css";

/** One white row in the product lists: photo, name, seller, price, rating and actions. */
export function ProductRow({ product }: { product: Product }) {
  return (
    <article className={styles.row}>
      <Link href={`/produk/${product.id}`} className={styles.media}>
        <Thumb src={imageSrc(product.image)} alt={product.image?.altText || product.name} />
      </Link>
      <div className={styles.info}>
        <Link href={`/produk/${product.id}`}>
          <h3>{product.name}</h3>
        </Link>
        <p className={styles.seller}>{sellerName(product)}</p>
        <p className={styles.stock}>{formatRupiah(product.price)}</p>
        <RatingSummary average={product.ratingAverage} count={product.reviewCount} />
      </div>
      <div className={styles.actions}>
        <Link href={`/produk/${product.id}`} className="btn btn-green btn-square btn-sm">
          <IconBox /> Lihat Produk
        </Link>
        {product.tenant?.tenant && (
          <Link href={`/umkm/${product.tenant.tenant.id}`} className="btn btn-navy btn-square btn-sm">
            <IconStore /> Lihat UMKM
          </Link>
        )}
      </div>
    </article>
  );
}
