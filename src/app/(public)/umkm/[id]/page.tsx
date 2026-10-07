import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListShell } from "@/components/site/ListShell";
import { ProductRow } from "@/components/site/ProductRow";
import { getAllLandingProducts } from "@/lib/server-api";
import { groupSellers } from "@/lib/sellers";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { products } = await getAllLandingProducts();
  const seller = groupSellers(products).find((s) => s.id === id);
  return { title: seller?.name ?? "UMKM" };
}

export default async function SellerPage({ params }: Props) {
  const { id } = await params;
  const { products } = await getAllLandingProducts();
  const sellers = groupSellers(products);
  const seller = sellers.find((s) => s.id === id);
  if (!seller) notFound();
  const list = products.filter((p) => p.tenant?.id === id);

  return (
    <ListShell
      sideTitle="UMKM"
      sideLinks={sellers.map((s) => ({ href: `/umkm/${s.id}`, label: s.name, active: s.id === id }))}
      title={seller.name}
      backHref="/umkm"
    >
      {list.map((p) => (
        <ProductRow key={p.id} product={p} />
      ))}
    </ListShell>
  );
}
