# Transniaga — Frontend

Next.js 15 (App Router, React 19, TypeScript, CSS Modules) frontend for **Transniaga**, the UMKM directory of the
Prafi transmigration area (Manokwari). It talks to the Prafi API — docs at
<https://api.transniaga.manokwarikab.go.id/docs>.

No UI or data libraries are used beyond Next/React: icons are inline SVG, styling is CSS Modules + `src/app/globals.css`.

- User guide (Bahasa Indonesia): [`docs/PANDUAN-PENGGUNA.md`](docs/PANDUAN-PENGGUNA.md) — also shown in the app at `/panduan`.
  Its step screenshots are in `public/panduan/` (taken from the real UI with sample data; the part each step
  refers to is outlined in red). Retake them if the screens change.

## Getting started

```bash
cp .env.example .env.local   # optional: defaults point at the production API
npm install
npm run dev                  # http://localhost:3000
npm run build && npm start   # production (port 80, see deploy/)
```

| variable | purpose |
| --- | --- |
| `API_URL` | Backend base URL (default `https://api.transniaga.manokwarikab.go.id`). Read at **build time**. |
| `SITE_URL` | This site's public address (default `https://transniaga.manokwarikab.go.id`), used for the product link in the WhatsApp message. Read at **build time**. |
| `NEXT_PUBLIC_ADMIN_WHATSAPP`, `NEXT_PUBLIC_ADMIN_EMAIL` | Contact shown under *Hubungi Administrator* (optional). |

### How requests reach the backend

The browser never calls the API domain directly. `next.config.ts` rewrites

- `/api/*` → `${API_URL}/api/*`
- `/images/*` → `${API_URL}/images/*` (uploaded pictures; the app always uses the relative `imgUrl`)
- `/socket.io/*` → `${API_URL}/socket.io/*`

so there is no CORS setup needed on the backend. Server components (landing pages) fetch `${API_URL}` directly and
cache for 60 s.

The backend's forgot-password email links to `<FRONTEND_URL>/reset-password?userId=…&token=…` — set `FRONTEND_URL`
in the **backend** `.env` to this site's URL.

## Routes

| path | who | what |
| --- | --- | --- |
| `/` | public | Landing: featured carousel, recommended products, "why Transniaga" |
| `/produk`, `/produk?q=` | public | All approved products + search |
| `/produk/[id]` | public | Product detail: price, rating, public reviews (read + write without login) |
| `/umkm`, `/umkm/[id]` | public | UMKM directory and page: profile, contact links, product count, rating, products (`/api/landing/tenants`) |
| `/panduan` | public | User guide |
| `/maintenance` | public | The old "under construction" page |
| `/login` | public | Login for every role, redirects by role |
| `/register` | public | Seller sign-up wizard: account → review → email OTP → done |
| `/register/admin` | public | Admin sign-up (needs Disnakertrans activation afterwards) |
| `/verifikasi?userId=&email=` | public | Email OTP for accounts that tried to log in unverified |
| `/lupa-password`, `/reset-password` | public | Forgot / reset password |
| `/admin/*` | admin | Dashboard, Konfirmasi Produk, Manajemen Produk, Kategori Produk (with carousel image), Manajemen UMKM, Notifikasi, Pengaturan |
| `/tenant/*` | tenant | Dashboard, Produk Saya, Tambah/Ubah Produk, Produk Ditolak, Profil UMKM, Notifikasi, Bantuan, Pengaturan |
| `/superadmin/*` | superadmin | Dashboard, Akun Disnakertrans (create + resend activation), Semua Pengguna, Data Produk, Data UMKM, Kategori Produk (read-only), Log API (signed-in users' create/update/delete requests and every auth action incl. guests' failed logins with the email tried, successful and failed, with result summary), Notifikasi, Pengaturan |
| `/disnakertrans/*` | disnakertrans | Dashboard, Aktivasi Admin (activate/deactivate admins), Konfirmasi Produk (approve/reject/deactivate, like admin), Data Produk, Kategori Produk (manage, like admin), Data UMKM, Notifikasi, Pengaturan |

## UI components (shadcn/ui + Tailwind)

The shared building blocks are [shadcn/ui](https://ui.shadcn.com) components in `src/components/shadcn/`
(`components.json`; add more with `npx shadcn@latest add <name>`), styled in Trans Niaga colours:

- **Button** (`variant`: navy, orange, green, red, blue, light, white, icon / icon-green / icon-red / icon-yellow;
  `size`: sm, default, lg, icon; `shape`: pill or square). Links and labels use `buttonVariants()`.
- **Input, Textarea, NativeSelect, Checkbox, Badge** (status variants active / pending / rejected / inactive),
  **Alert** (info / success / warning / destructive), **Card** (`cardClassName` for non-div elements), **Table**,
  **Tabs** (`components/dashboard/PillTabs.tsx`), **Dialog / AlertDialog** (behind `Modal` / `ConfirmDialog`),
  **Sonner** (behind `useToast`), **Chart** (Recharts; `components/dashboard/StatsCharts.tsx`).

**Every update and delete asks first.** Use `useConfirm()` from `components/Modal.tsx`
(`if (!(await confirm({ title, message }))) return;`, render its `dialog`), or `ConfirmDialog` directly. Creating
something new needs no confirmation.

Tailwind CSS v4 is loaded in `src/app/shadcn.css` (before `globals.css`) **without its global reset**, so the
existing page styles (CSS modules) keep working; theme tokens map shadcn's colours to the brand. Page layout rules can
target any button through the `btn-ui` class.

## Code map

```
src/
  app/                 routes (see table above); (public) = landing layout with header/footer
  components/
    site/              landing header, footer, product cards/rows, carousel
    auth/              auth page frame, registration wizard, OTP form
    dashboard/         sidebar shell, notifications, product form/review/browser, user accounts table,
                       shop profiles, account settings, stats
    ui.tsx             brand, page header, pagination, image picker, password input, ...
    UploadDialog.tsx   photo upload with progress popup; a photo is "pending" until the form's Simpan attaches it
    LeaveGuard.tsx     "Tinggalkan halaman ini?" when leaving with an unsaved photo (Setuju deletes it)
    Stars.tsx          star rating display
    Icons.tsx, Modal.tsx, Toast.tsx, GuideList.tsx
  lib/
    api.ts             browser API client — one function per documented endpoint
    server-api.ts      landing data for server components
    auth.tsx           session (token in localStorage, 1-hour expiry, 401 → logout)
    notifications.tsx  unread badge (polling)
    format.ts          dates, names, rupiah, ratings, product status logic
    notificationText.ts  notification titles/messages in Bahasa Indonesia, per type and role
    pendingUploads.ts  unsaved uploads in localStorage, deleted on leave / next visit
    guides.tsx         user-guide content (used by /panduan and /tenant/bantuan)
    types.ts           API response types
```

### API coverage

Every endpoint in the API docs is wired in `src/lib/api.ts`. Admin-only/tenant-only endpoints are used by those
dashboards; the superadmin creates disnakertrans accounts, reads everything and views the API log; disnakertrans
activates admins and approves products like admins. Tenants need a complete UMKM profile and an account photo before
they can add products.

### Categories, recommendations, WhatsApp

- **Product categories** (`/api/product-categories`, admin and disnakertrans manage, everyone reads; shared page
  `components/dashboard/CategoryManager.tsx`) belong to products (`categoryId`,
  required in the product form); UMKM profiles no longer have one. Each category must have an image (required on create, can be replaced but not removed): the home page
  (`components/site/HomeHero.tsx`) shows one carousel slide per category with approved products (its image; older categories without one use
  their best product's photo until an image is added), and the cards beside it show that category's 3 best rated products.
- **Recommended** (`isRecommended`) is set by the backend: reviews average 4.8 stars or more. Tenants can't set it.
- **WhatsApp buttons** open with a prefilled message (`lib/format.ts → whatsappWithText`): on a product page
  `Halo kak saya ingin menanyakan tentang produk <name> apakah masih ada? <SITE_URL>/produk/<id>`, on a UMKM page
  `Hi kak, saya mau bertanya tentang produk di toko <name>`.

### Product status

The API stores only `approval.isActive` and `approval.reason`. The frontend derives four statuses (`lib/format.ts →
productStatus`):

| status | rule |
| --- | --- |
| Aktif | `isActive: true` |
| Menunggu Konfirmasi | inactive and reason is `Waiting for approval`, **or** the product was edited after the last decision (re-submitted) |
| Ditolak | inactive and reason starts with `Ditolak: ` (written by the admin / disnakertrans "Tolak" action) |
| Dinonaktifkan | any other inactive product (an admin or disnakertrans took it down) |

### Realtime

The dashboards keep one Socket.IO connection per signed-in tab (`src/lib/realtime.tsx`, `socket.io-client`), through
this site's own `/socket.io/` proxy (`next.config.ts`), authenticated with the login token:

- `notification:new` / `notification:unread-count` update the bell badge and open notification lists right away
  (`GET /api/notifications/unread-count` is still polled every 60 s and on tab focus as a fallback)
- `log:new` adds new rows to the superadmin's *Log API* page live (a "● Live" badge shows the connection)
- `session:ended` logs the tab out (expired, logged out elsewhere, deactivated, password reset)

## Known API gaps (frontend works around them)

1. **No banner/announcement API** — the design's *Banner & Informasi* admin page is not built.
2. Registration step *Unggah Foto KTP* is not built: image upload requires login, and there is no KTP field.
3. The landing "Kategori"/"Wilayah" menus from the design are replaced by *Produk* and *UMKM*. Product categories
   appear in the home carousel (one slide per category image, its products next to it) and at `/produk?kategori=<id>`.

## Deploy

See `deploy/` (systemd unit runs `npm start` on port 80; nginx terminates TLS). After pulling: `npm ci && npm run
build && sudo systemctl restart prafi-frontend`.
