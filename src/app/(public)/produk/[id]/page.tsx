import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconDocs, IconFacebook, IconGoogle, IconHeart, IconInstagram, IconMapPin, IconShopee, IconStore, IconThumb, IconWhatsapp } from "@/components/Icons";
import { ProductReviews } from "@/components/site/ProductReviews";
import { ProductStrip } from "@/components/site/ProductStrip";
import { RatingSummary } from "@/components/Stars";
import { EmptyState, PageHeader, Thumb } from "@/components/ui";
import { formatDate, formatRupiah, imageSrc, productWhatsappText, sellerName, whatsappWithText } from "@/lib/format";
import type { Product } from "@/lib/types";
import { getLandingProduct, getLandingProducts } from "@/lib/server-api";
import styles from "./detail.module.css";
import { buttonVariants } from "@/components/shadcn/button";
import { Card, cardClassName } from "@/components/shadcn/card";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

/** Optional links are null or saved as "-" when left empty */
const isLink = (v?: string | null): v is string => !!v && /^https?:\/\//i.test(v);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product } = await getLandingProduct((await params).id);
  return product ? { title: product.name, description: product.description } : { title: "Produk" };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const { product, failed } = await getLandingProduct(id);
  if (failed) {
    return (
      <div className={styles.page}>
        <PageHeader title="INFORMASI PRODUK" backHref="/produk" />
        <EmptyState title="Produk belum dapat dimuat">Silakan muat ulang halaman beberapa saat lagi.</EmptyState>
      </div>
    );
  }
  if (!product) notFound();

  const [seller, latest] = await Promise.all([
    product.tenant ? getLandingProducts(1, 13, { tenantId: product.tenant.id }) : null,
    getLandingProducts(1, 13),
  ]);
  const fromSeller = (seller?.products ?? []).filter((p) => p.id !== product.id);
  const others = fromSeller.length ? fromSeller : latest.products.filter((p) => p.id !== product.id).slice(0, 12);

  return (
    <div className={styles.page}>
      <PageHeader title="INFORMASI PRODUK" backHref="/produk" />

      <div className={styles.layout}>
        <div className={styles.photo}>
          <Thumb src={imageSrc(product.image)} alt={product.image?.altText || product.name} />
        </div>

        <div className={styles.info}>
          <p className={styles.kicker}>
            {sellerName(product)}
            {product.category && (
              <>
                {" · "}
                <Link href={`/produk?kategori=${product.category.id}`}>{product.category.name}</Link>
              </>
            )}
          </p>
          <Card className={styles.main}>
            <div className={styles.mainLeft}>
              <h1>{product.name}</h1>
              <p className={styles.stock}>{formatRupiah(product.price)}</p>
              <a href="#ulasan" className={styles.rating}>
                <RatingSummary average={product.ratingAverage} count={product.reviewCount} size="md" />
              </a>
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
          </Card>

          <div className={styles.bottom}>
            {product.tenant?.tenant && (
              <Link href={`/umkm/${product.tenant.tenant.id}`} className={cn(cardClassName, styles.seller)}>
                <IconStore />
                <div>
                  <strong>{sellerName(product)}</strong>
                  <span>Lihat profil dan semua produk UMKM ini</span>
                </div>
              </Link>
            )}
            <p className={styles.since}>Tayang sejak {formatDate(product.createdAt)}</p>
          </div>

          <ShopLinks shop={product.tenant?.tenant} product={product} />
        </div>
      </div>

      <ProductReviews productId={product.id} initial={{ ratingAverage: product.ratingAverage, reviewCount: product.reviewCount }} />

      {others.length > 0 && (
        <section className={styles.more}>
          <h2>{fromSeller.length ? "PRODUK LAIN DARI UMKM INI" : "PRODUK REKOMENDASI LAINNYA"}</h2>
          <ProductStrip products={others} />
        </section>
      )}
    </div>
  );
}

/**
 * The seller's contact / shop buttons; only the links the UMKM filled in are shown. WhatsApp opens with a message
 * about this product (its name and link) already typed.
 */
function ShopLinks({ shop, product }: { shop?: NonNullable<NonNullable<Product["tenant"]>["tenant"]> | null; product: Product }) {
  if (!shop) return null;
  const links = [
    {
      href: isLink(shop.whatsappLink) ? whatsappWithText(shop.whatsappLink, productWhatsappText(product)) : null,
      label: "WhatsApp",
      icon: IconWhatsapp,
      tone: "green",
    },
    { href: shop.shopeeLink, label: "Shopee", icon: IconShopee, tone: "orange" },
    { href: shop.instagramLink, label: "Instagram", icon: IconInstagram, tone: "orange" },
    { href: shop.googleBusinessLink, label: "Google Bisnis", icon: IconGoogle, tone: "blue" },
    { href: shop.fbLink, label: "Facebook", icon: IconFacebook, tone: "blue" },
    { href: shop.gmapsLink, label: "Lokasi", icon: IconMapPin, tone: "navy" },
  ].filter((l) => isLink(l.href)) as { href: string; label: string; icon: typeof IconWhatsapp; tone: "green" | "orange" | "blue" | "navy" }[];
  if (!links.length) return null;
  return (
    <Card className={styles.links}>
      <h2>Hubungi &amp; Kunjungi Toko</h2>
      <div className={styles.linkRow}>
        {links.map(({ href, label, icon: Icon, tone }) => (
          <a key={label} href={href!} target="_blank" rel="noreferrer" className={buttonVariants({ variant: tone, size: "sm" })}>
            <Icon /> {label}
          </a>
        ))}
      </div>
    </Card>
  );
}
