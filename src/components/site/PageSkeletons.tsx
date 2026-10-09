import { Skeleton } from "@/components/shadcn/skeleton";
import { cn } from "@/lib/utils";

/*
 * Placeholders shown by the routes' loading.tsx the moment a link is clicked, while the server prepares the page.
 * Next.js prefetches them with the links, so they appear at once: visitors see the click worked and don't click again.
 * Shapes follow the real pages (same widths and breakpoints), so nothing jumps when the content arrives.
 */

/** Screen readers hear one "loading" message; the grey blocks are hidden from them */
function Status({ label = "Memuat halaman..." }: { label?: string }) {
  return (
    <span role="status" className="sr-only">
      {label}
    </span>
  );
}

/** Back arrow + page title */
function TitleBar({ className }: { className?: string }) {
  return (
    <div className={cn("mb-7 flex items-center gap-5 max-[900px]:gap-2", className)} aria-hidden>
      <Skeleton className="size-9 rounded-full" />
      <Skeleton className="h-8 w-64 max-w-[60%] rounded-lg" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow)]" aria-hidden>
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-2/5" />
      </div>
    </div>
  );
}

/** Beranda: carousel + map card + three product cards, then a row of products */
export function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-[1240px] px-6 pt-9 pb-14 max-[900px]:px-4 max-[900px]:pt-5">
      <Status />
      <div className="grid items-center gap-10 min-[901px]:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]" aria-hidden>
        <div className="flex justify-center">
          <Skeleton className="aspect-[2/3] w-[min(240px,52%)] rounded-[22px]" />
        </div>
        <div className="flex flex-col gap-7">
          <Skeleton className="h-40 w-full rounded-[28px]" />
          <div className="grid grid-cols-3 gap-4 max-[600px]:grid-cols-2">
            <CardSkeleton />
            <CardSkeleton />
            <div className="max-[600px]:hidden">
              <CardSkeleton />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-12 grid grid-cols-4 gap-4 max-[900px]:grid-cols-2" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * The navy side list + content panel of /produk and /umkm (ListShell). `rows`: product rows; `cards`: the UMKM
 * card grid; `profile`: one UMKM's profile above its products.
 */
export function ListSkeleton({ variant = "rows" }: { variant?: "rows" | "cards" | "profile" }) {
  return (
    <div className="grid min-h-[calc(100vh-92px)] grid-cols-[260px_minmax(0,1fr)] max-[900px]:min-h-0 max-[900px]:grid-cols-[minmax(0,1fr)]">
      <Status />
      <aside className="bg-brand-navy px-8 py-12 max-[900px]:p-4" aria-hidden>
        <Skeleton className="mb-10 h-6 w-24 bg-white/25 max-[900px]:mb-3" />
        <div className="flex flex-col gap-3 max-[900px]:flex-row max-[900px]:overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-5 w-full shrink-0 bg-white/20 max-[900px]:h-8 max-[900px]:w-28 max-[900px]:rounded-full" />
          ))}
        </div>
      </aside>
      <section className="min-w-0 px-12 pt-10 max-[900px]:px-4 max-[900px]:pt-5" aria-hidden>
        <TitleBar />
        <Skeleton className="mb-5 h-10 w-full max-w-md rounded-full" />
        <div className="rounded-[28px] bg-[#d9d9d9] p-6 shadow-[var(--shadow-lg)] max-[600px]:p-3">
          {variant === "profile" && (
            <div className="mb-5 flex gap-5 rounded-2xl bg-white p-5 max-[600px]:flex-col max-[600px]:items-center">
              <Skeleton className="size-28 shrink-0 rounded-2xl" />
              <div className="flex w-full flex-col gap-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-9 w-48 rounded-full" />
              </div>
            </div>
          )}
          {variant === "cards" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex gap-4 rounded-2xl bg-white p-5">
                  <Skeleton className="size-16 shrink-0 rounded-xl" />
                  <div className="flex w-full flex-col gap-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex gap-4 rounded-2xl bg-white p-4">
                  <Skeleton className="size-20 shrink-0 rounded-xl" />
                  <div className="flex w-full flex-col gap-2 pt-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/** Informasi Produk: photo + info card + contact buttons */
export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1240px] px-6 pt-9 pb-14 max-[900px]:px-4 max-[900px]:pt-5">
      <Status />
      <TitleBar />
      <div className="grid items-start gap-8 min-[761px]:grid-cols-[minmax(0,300px)_minmax(0,1fr)]" aria-hidden>
        <Skeleton className="aspect-[9/10] w-full rounded-[14px] max-[760px]:mx-auto max-[760px]:max-w-[320px]" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-6 rounded-2xl bg-white p-6 shadow-[var(--shadow)] min-[761px]:grid-cols-2">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <Skeleton className="h-20 w-full rounded-2xl" />
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The public page placeholder for a path: the shape of the page being opened */
export function PublicSkeleton({ path }: { path: string }) {
  if (/^\/produk\/[^/]+/.test(path)) return <ProductDetailSkeleton />;
  if (path.startsWith("/produk")) return <ListSkeleton />;
  if (/^\/umkm\/[^/]+/.test(path)) return <ListSkeleton variant="profile" />;
  if (path.startsWith("/umkm")) return <ListSkeleton variant="cards" />;
  return <HomeSkeleton />;
}

/** Dashboards: title + a few cards (inside the dashboard's own sidebar layout) */
export function DashboardSkeleton() {
  return (
    <div>
      <Status label="Memuat data..." />
      <TitleBar />
      <div className="grid grid-cols-3 gap-7 max-[1100px]:grid-cols-2 max-[480px]:gap-3" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-[var(--shadow)] max-[480px]:flex-col max-[480px]:items-start max-[480px]:p-3.5">
            <Skeleton className="size-14 shrink-0 rounded-full max-[480px]:size-10" />
            <div className="flex w-full flex-col gap-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-7 w-1/3" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="mt-7 h-56 w-full rounded-[20px]" aria-hidden />
    </div>
  );
}
