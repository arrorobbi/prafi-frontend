"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { roleHome, useAuth } from "@/lib/auth";
import { sellerName } from "@/lib/format";
import type { Product } from "@/lib/types";
import { IconClose, IconMenu, IconSearch, IconStore } from "../Icons";
import { Brand } from "../ui";
import styles from "./SiteHeader.module.css";

const NAV = [
  { href: "/", label: "Beranda" },
  { href: "/produk", label: "Produk" },
  { href: "/umkm", label: "UMKM" },
];

let productCache: Promise<Product[]> | null = null;
/** Approved products for search suggestions, fetched once per page load. */
function loadProducts() {
  productCache ??= api.landing
    .products({ limit: 100 })
    .then((r) => r.data)
    .catch(() => {
      productCache = null;
      return [];
    });
  return productCache;
}

function Highlight({ text, query }: { text: string; query: string }) {
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0 || !query) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <b>{text.slice(i, i + query.length)}</b>
      {text.slice(i + query.length)}
    </>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const popRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!searchOpen) return;
    loadProducts().then(setProducts);
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSearchOpen(false);
    const onClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [searchOpen]);

  const q = query.trim();
  const matches = useMemo(() => {
    if (!q) return [];
    const lower = q.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(lower)).slice(0, 6);
  }, [products, q]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Brand />

        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`} aria-label="Navigasi utama">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={isActive(item.href) ? styles.active : ""}>
              {item.label}
            </Link>
          ))}
          <Link href="/panduan" className={`${styles.mobileOnly} ${isActive("/panduan") ? styles.active : ""}`}>
            Panduan
          </Link>
        </nav>

        <div className={styles.actions}>
          <div className={styles.searchWrap} ref={popRef}>
            <button
              type="button"
              className={styles.searchBtn}
              aria-label="Cari produk"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((o) => !o)}
            >
              <IconSearch />
            </button>
            {searchOpen && (
              <div className={styles.popover}>
                <form
                  role="search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (q) router.push(`/produk?q=${encodeURIComponent(q)}`);
                  }}
                >
                  <input
                    ref={inputRef}
                    className={styles.searchInput}
                    placeholder="Apa yang sedang anda cari...."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Kata kunci"
                  />
                </form>
                {q && (
                  <ul className={styles.results}>
                    <li>
                      <Link href={`/umkm?q=${encodeURIComponent(q)}`} className={styles.storeRow}>
                        <IconStore />
                        Cari Toko &ldquo;{q}&rdquo;
                      </Link>
                    </li>
                    {matches.map((p) => (
                      <li key={p.id}>
                        <Link href={`/produk/${p.id}`}>
                          <span>
                            <Highlight text={p.name} query={q} />
                          </span>
                          <small>{sellerName(p)}</small>
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link href={`/produk?q=${encodeURIComponent(q)}`} className={styles.allRow}>
                        Lihat semua hasil untuk &ldquo;{q}&rdquo;
                      </Link>
                    </li>
                  </ul>
                )}
              </div>
            )}
          </div>

          {status === "authenticated" && user ? (
            <Link href={roleHome(user.role)} className="btn btn-orange">
              Dashboard
            </Link>
          ) : (
            <Link href="/login" className="btn btn-orange">
              Login
            </Link>
          )}

          <button
            type="button"
            className={styles.menuBtn}
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>
    </header>
  );
}
