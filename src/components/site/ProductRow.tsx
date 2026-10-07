import Link from "next/link";
import { formatNumber, imageSrc, sellerName } from "@/lib/format";
import type { Product } from "@/lib/types";
import { IconBox, IconStore } from "../Icons";
import { Thumb } from "../ui";
import styles from "./ProductRow.module.css";

/** One white row in the product lists: photo, name, seller, stock and actions. */
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
        <p className={styles.stock}>Stok {formatNumber(product.qty)}</p>
      </div>
      <div className={styles.actions}>
        <Link href={`/produk/${product.id}`} className="btn btn-green btn-square btn-sm">
          <IconBox /> Lihat Produk
        </Link>
        {product.tenant && (
          <Link href={`/umkm/${product.tenant.id}`} className="btn btn-navy btn-square btn-sm">
            <IconStore /> Lihat UMKM
          </Link>
        )}
      </div>
    </article>
  );
}
