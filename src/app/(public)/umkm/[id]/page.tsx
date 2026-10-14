import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { IconBox, IconClock, IconFacebook, IconGoogle, IconInstagram, IconMapPin, IconShopee, IconStore, IconWhatsapp } from "@/components/Icons";
import { ListShell } from "@/components/site/ListShell";
import { ProductRow } from "@/components/site/ProductRow";
import { RatingSummary } from "@/components/Stars";
import { EmptyState, Thumb } from "@/components/ui";
import { formatRating, imageSrc, tenantWhatsappText, whatsappWithText, tenantPath } from "@/lib/format";
import { abs, breadcrumbLd, JsonLd, pageMeta } from "@/lib/seo";
import { getLandingProducts, getLandingTenant, getLandingTenants } from "@/lib/server-api";
import type { PublicTenant } from "@/lib/types";
import styles from "../umkm.module.css";
import { buttonVariants } from "@/components/shadcn/button";

type Props = { params: Promise<{ id: string }> };

/** Optional links are saved as "-" when left empty */
const isLink = (v?: string | null): v is string => !!v && /^https?:\/\//i.test(v);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant } = await getLandingTenant((await params).id);
  if (!tenant) return { title: "UMKM", robots: { index: false } };
  return pageMeta({
    title: `${tenant.name} - UMKM ${tenant.area}`,
    description: `${tenant.name}, UMKM di ${tenant.area}, Prafi, Manokwari. ${tenant.description} Alamat: ${tenant.address}.`,
    // One address per UMKM: the page also opens by its owner's id (links from product pages)
    path: tenantPath(tenant),
    image: tenant.logo ? { url: imageSrc(tenant.logo), alt: `Logo ${tenant.name}` } : null,
  });
}

/** Shop structured data: name, address, contact and rating, for Google's business-style results */
function storeLd(tenant: PublicTenant) {
  const links = [tenant.instagramLink, tenant.fbLink, tenant.shopeeLink, tenant.googleBusinessLink].filter((l): l is string => isLink(l));
  const phone = isLink(tenant.whatsappLink) ? tenant.whatsappLink.match(/wa\.me\/(\d{8,15})/)?.[1] : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": abs(`/umkm/${tenant.id}#store`),
    name: tenant.name,
    description: tenant.description,
    url: abs(tenantPath(tenant)),
    ...(tenant.logo && { image: abs(imageSrc(tenant.logo)), logo: abs(imageSrc(tenant.logo)) }),
    address: {
      "@type": "PostalAddress",
      streetAddress: tenant.address,
      addressLocality: `${tenant.area}, Prafi, Manokwari`,
      addressRegion: "Papua Barat",
      addressCountry: "ID",
    },
    ...(phone && { telephone: `+${phone}` }),
    ...(isLink(tenant.gmapsLink) && { hasMap: tenant.gmapsLink }),
    ...(links.length && { sameAs: links }),
    ...(tenant.reviewCount > 0 &&
      tenant.ratingAverage != null && {
        aggregateRating: { "@type": "AggregateRating", ratingValue: tenant.ratingAverage, reviewCount: tenant.reviewCount, bestRating: 5, worstRating: 1 },
      }),
  };
}

/**
 * One UMKM (GET /api/landing/tenants/:id, by slug; the profile's or its owner's id also work, so product pages
 * link here directly): profile, contact links, summary and its approved products.
 */
export default async function SellerPage({ params }: Props) {
  const { id } = await params;
  const [{ tenant, failed }, all] = await Promise.all([getLandingTenant(id), getLandingTenants()]);
  const sideLinks = all.tenants.map((t) => ({ href: tenantPath(t), label: t.name, active: t.id === tenant?.id }));

  if (failed) {
    return (
      <ListShell sideTitle="UMKM" sideLinks={sideLinks} title="UMKM" backHref="/umkm">
        <EmptyState title="Data UMKM belum dapat dimuat">Silakan muat ulang halaman beberapa saat lagi.</EmptyState>
      </ListShell>
    );
  }
  if (!tenant) notFound();
  // Opened by id (a link from before slugs, or from a product's owner) or by a slug from before a rename: on to its address
  if (tenant.slug && id !== tenant.slug) permanentRedirect(tenantPath(tenant));
  const { products } = await getLandingProducts(1, 100, { tenantId: tenant.userId });

  return (
    <>
    <JsonLd data={storeLd(tenant)} />
    <JsonLd data={breadcrumbLd([{ name: "Beranda", path: "/" }, { name: "UMKM", path: "/umkm" }, { name: tenant.name, path: tenantPath(tenant) }])} />
    <ListShell sideTitle="UMKM" sideLinks={sideLinks} title={tenant.name} backHref="/umkm">
      <section className={styles.profile}>
        <Thumb zoom src={imageSrc(tenant.logo)} alt={`Logo ${tenant.name}`} className={styles.profileLogo} />
        <div className={styles.profileBody}>
          <p className={styles.profileDesc}>{tenant.description}</p>
          <ul className={styles.facts}>
            <li>
              <IconMapPin />
              <span>
                {tenant.address} · {tenant.area}
              </span>
            </li>
            <li>
              <IconClock />
              <span>{tenant.operationalHours}</span>
            </li>
          </ul>
          <div className={styles.links}>
            {isLink(tenant.whatsappLink) && (
              <a
                href={whatsappWithText(tenant.whatsappLink, tenantWhatsappText(tenant))}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: "green", size: "sm" })}
              >
                <IconWhatsapp /> WhatsApp
              </a>
            )}
            {isLink(tenant.gmapsLink) && (
              <a href={tenant.gmapsLink} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "navy", size: "sm" })}>
                <IconMapPin /> Lokasi
              </a>
            )}
            {isLink(tenant.instagramLink) && (
              <a href={tenant.instagramLink!} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "orange", size: "sm" })}>
                <IconInstagram /> Instagram
              </a>
            )}
            {isLink(tenant.shopeeLink) && (
              <a href={tenant.shopeeLink!} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "orange", size: "sm" })}>
                <IconShopee /> Shopee
              </a>
            )}
            {isLink(tenant.googleBusinessLink) && (
              <a href={tenant.googleBusinessLink!} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "blue", size: "sm" })}>
                <IconGoogle /> Google Bisnis
              </a>
            )}
            {isLink(tenant.fbLink) && (
              <a href={tenant.fbLink} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "blue", size: "sm" })}>
                <IconFacebook /> Facebook
              </a>
            )}
          </div>
        </div>
      </section>

      <div className={styles.stats}>
        <div>
          <IconBox />
          <strong>{tenant.productCount}</strong>
          <span>Produk</span>
        </div>
        <div>
          <span className={styles.star} aria-hidden>
            ★
          </span>
          <strong>{tenant.ratingAverage != null ? formatRating(tenant.ratingAverage) : "-"}</strong>
          <span>Rata-rata bintang</span>
        </div>
        <div>
          <IconStore />
          <strong>{tenant.reviewCount}</strong>
          <span>Ulasan</span>
        </div>
      </div>

      <h3 className={styles.sectionTitle}>PRODUK DARI UMKM INI</h3>
      {products.length === 0 ? (
        <EmptyState title="Belum ada produk">Produk tampil di sini setelah disetujui administrator.</EmptyState>
      ) : (
        <>
          <p className={styles.ratingLine}>
            <RatingSummary average={tenant.ratingAverage} count={tenant.reviewCount} />
          </p>
          {products.map((p) => (
            <ProductRow key={p.id} product={p} />
          ))}
        </>
      )}
    </ListShell>
    </>
  );
}
