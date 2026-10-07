import Link from "next/link";
import { formatNumber, imageSrc, sellerName } from "@/lib/format";
import type { Product } from "@/lib/types";
import { IconThumb } from "../Icons";
import { Thumb } from "../ui";
import styles from "./ProductCard.module.css";

export function ProductCard({ product, small, recommended }: { product: Product; small?: boolean; recommended?: boolean }) {
  return (
    <Link href={`/produk/${product.id}`} className={`${styles.card} ${small ? styles.small : ""}`}>
      <div className={styles.media}>
        <Thumb src={imageSrc(product.image)} alt={product.image?.altText || product.name} className={styles.img} />
        {recommended && (
          <span className={styles.thumb} title="Rekomendasi">
            <IconThumb />
          </span>
        )}
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.seller}>{sellerName(product)}</p>
        <p className={styles.stock}>Stok {formatNumber(product.qty)}</p>
      </div>
    </Link>
  );
}
