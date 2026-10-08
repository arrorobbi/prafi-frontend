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
| `/admin/*` | admin | Dashboard, Konfirmasi Produk, Manajemen Produk, Kategori UMKM, Manajemen UMKM, Notifikasi, Pengaturan |
| `/tenant/*` | tenant | Dashboard, Produk Saya, Tambah/Ubah Produk, Produk Ditolak, Profil UMKM, Notifikasi, Bantuan, Pengaturan |
| `/superadmin/*` | superadmin | Dashboard, Akun Disnakertrans (create + resend activation), Semua Pengguna, Data Produk, Data UMKM, Kategori UMKM (read-only), Log API (signed-in users' create/update/delete requests and every auth action incl. guests' failed logins with the email tried, successful and failed, with result summary), Notifikasi, Pengaturan |
| `/disnakertrans/*` | disnakertrans | Dashboard, Aktivasi Admin (activate/deactivate admins), Konfirmasi Produk (approve/reject/deactivate, like admin), Data Produk, Data UMKM, Notifikasi, Pengaturan |

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

The unread badge polls `GET /api/notifications/unread-count` every 30 s and on tab focus. The backend also pushes
`notification:new` / `session:ended` over Socket.IO (already proxied at `/socket.io/`); switching to it needs the
`socket.io-client` package, which is not installed yet.

## Known API gaps (frontend works around them)

1. **No price field** on products — cards show stock (`qty`) instead; sellers can write the price in *Informasi Produk*.
2. **Tenant categories are readable only by superadmin/admin** — sellers get 403 when creating their shop profile, so
   they cannot pick a category. Fix in the backend: add `ROLES.TENANT` to `TENANT_CATEGORY_READER_ROLES`
   (`src/constants/roles.ts`). The profile form shows a warning until then.
3. **Public endpoints only list approved products** — no public product detail, category, seller profile, WhatsApp
   or area data. Landing "Kategori"/"Wilayah" menus from the design are therefore replaced by *Produk* and *UMKM*, and
   detail/seller pages filter the public list.
4. **No rejection notification** for the seller (`PRODUCT_DEACTIVATED` goes to superadmins only); sellers see the
   status and reason under *Produk Ditolak*.
5. **No banner/announcement API** — the design's *Banner & Informasi* admin page is not built.
6. Registration step *Unggah Foto KTP* is not built: image upload requires login, and there is no KTP field.

## Deploy

See `deploy/` (systemd unit runs `npm start` on port 80; nginx terminates TLS). After pulling: `npm ci && npm run
build && sudo systemctl restart prafi-frontend`.
