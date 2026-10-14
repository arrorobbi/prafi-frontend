import Link from "next/link";
import { formatRupiah, imageSrc, sellerName, productPath, tenantPath } from "@/lib/format";
import type { Product } from "@/lib/types";
import { IconBox, IconStore } from "../Icons";
import { RatingSummary } from "../Stars";
import { Thumb } from "../ui";
import styles from "./ProductRow.module.css";
import { buttonVariants } from "@/components/shadcn/button";

/**
 * One white row in the product lists: photo, name, seller, price, rating and actions. A click anywhere on the row
 * opens the product (`card-link`); "Lihat UMKM" keeps its own target.
 */
export function ProductRow({ product }: { product: Product }) {
  return (
    <article className={`${styles.row} card-link`}>
      <Link href={productPath(product)} className={styles.media} tabIndex={-1} aria-hidden>
        <Thumb src={imageSrc(product.image)} alt={product.image?.altText || product.name} />
      </Link>
      <div className={styles.info}>
        <Link href={productPath(product)} className="card-link-main">
          <h3>{product.name}</h3>
        </Link>
        <p className={styles.seller}>{sellerName(product)}</p>
        <p className={styles.stock}>{formatRupiah(product.price)}</p>
        <RatingSummary average={product.ratingAverage} count={product.reviewCount} />
      </div>
      <div className={styles.actions}>
        <Link href={productPath(product)} className={buttonVariants({ variant: "green", shape: "square", size: "sm" })}>
          <IconBox /> Lihat Produk
        </Link>
        {product.tenant?.tenant && (
          <Link href={tenantPath(product.tenant.tenant)} className={buttonVariants({ variant: "navy", shape: "square", size: "sm" })}>
            <IconStore /> Lihat UMKM
          </Link>
        )}
      </div>
    </article>
  );
}
