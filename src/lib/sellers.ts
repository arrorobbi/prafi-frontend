import { fullName, sellerName } from "./format";
import type { ImageFile, Product } from "./types";

export interface Seller {
  id: string;
  name: string;
  owner: string;
  productCount: number;
  image: ImageFile | null;
}

/**
 * The public API has no seller (tenant profile) endpoint, so the UMKM pages are built from the
 * owners of the approved products.
 */
export function groupSellers(products: Product[]): Seller[] {
  const map = new Map<string, Seller>();
  for (const p of products) {
    if (!p.tenant) continue;
    const seller = map.get(p.tenant.id);
    if (seller) seller.productCount++;
    else
      map.set(p.tenant.id, {
        id: p.tenant.id,
        name: sellerName(p),
        owner: fullName(p.tenant),
        productCount: 1,
        image: p.image,
      });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "id"));
}

export const matches = (text: string, q: string) => text.toLowerCase().includes(q.toLowerCase());
