# Dr. Ahmed El Masry — website + dashboard

A rebuild of **www.doctorahmedelmasry.com** with **Next.js (React)** and **Supabase**.

- **Public website**: same design, same addresses (URLs), same Arabic/English content and images as the old site.
- **Dashboard** at **`/admin`**: manage every service, article, story, FAQ, video, photo, testimonial, home page section, page text, menu, footer, contact details, SEO tags, contact-form messages, media files and admin users.

---

## How it fits together

| Part | Where |
| --- | --- |
| Public pages (same markup and theme as the old site) | `src/app/(site)/`, `src/components/site/` |
| Dashboard | `src/app/(admin)/admin/`, `src/components/admin/`, `src/lib/admin/` |
| What the dashboard can edit (types, fields, pages) | `src/lib/content-types.ts` |
| Database schema, security rules, storage bucket | `supabase/migrations/0001_init.sql` |
| All content copied from the old site | `supabase/seed/seed.json` |
| Load content + images into Supabase | `scripts/import.mjs` |
| Create the first admin | `scripts/create-admin.mjs` |
| Copy the latest content again from the old site | `scripts/migrate/run.sh` |
| Original theme files (CSS, JS, fonts, logos) | `public/assets/` |

- **Language:** Arabic is the default and `?clang=2` switches to English (`?clang=1` back to Arabic), just like the old site. Article pages always show in the article's own language.
- **URL quirks kept as on the old site:**
  - Addresses are case-insensitive (`/bariatricSurgeryDetail/...` and `/bariatricsurgeryDetail/...` both work).
  - A missing article redirects to `/ItemNotFound`, and an unknown address redirects to `/`.
  - The contact form still posts to `/Home/SendEmail`. Messages are saved to the database and appear in the dashboard under **Messages**.
- **Images:**
  - All `/ApplicationImages/...` images and PDFs are stored in Supabase Storage (bucket `media`) and served at their **original addresses**.
  - Supabase only accepts English letters in file names, so Arabic names are stored encoded (`src/lib/storage-key.ts`) and decoded automatically.
  - New uploads from the dashboard go to `media/uploads/...`.
- **Speed:** page data is cached, and every save in the dashboard refreshes the cache instantly.

---

## 1. Set up Supabase (one time)

1. Open the project: https://supabase.com/dashboard/project/dzbfvizjiwyxototmygg
2. **SQL Editor → New query**: paste all of `supabase/migrations/0001_init.sql` and click **Run**.
3. **Project Settings → API**: copy the *Project URL*, the *anon / publishable* key and the *service_role / secret* key.
4. **Authentication → URL Configuration**: set *Site URL* to your domain (e.g. `https://www.doctorahmedelmasry.com`).
5. **Authentication → Providers → Email**: turn **off** "Allow new users to sign up". Admins are added from the dashboard, so nobody else can register.

## 2. Configure and import the content

```bash
npm install
```

Create `.env.local` in the project folder:

```
NEXT_PUBLIC_SUPABASE_URL=https://dzbfvizjiwyxototmygg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key — keep secret>
NEXT_PUBLIC_SITE_URL=https://www.doctorahmedelmasry.com
```

Load all pages, articles, settings and images (the images are downloaded from the old site):

```bash
node scripts/import.mjs
```

Create your dashboard login (owner):

```bash
node scripts/create-admin.mjs you@example.com "A-Strong-Password" owner
```

Run it locally:

```bash
npm run dev
```

Then open http://localhost:3000 (website) and http://localhost:3000/admin (dashboard).

## 3. Before launch: copy the newest content from the old site

If content is still being edited in the old Cpanel, copy it again right before switching the domain. This needs Python 3 with `beautifulsoup4`:

```bash
bash scripts/migrate/run.sh
```

```bash
node scripts/import.mjs --images .migrate/assets --revalidate https://www.doctorahmedelmasry.com
```

Running the import again updates existing entries (matched by type + address) and adds new ones. It does not delete anything.

## 4. Deploy (Vercel recommended)

1. Push this repository to GitHub.
2. On https://vercel.com: **Add New → Project →** import the repository (framework: Next.js).
3. Add the 4 environment variables from step 2 under **Settings → Environment Variables**.
4. Deploy. You get a test address like `your-project.vercel.app`; check everything there first.

## 5. Connect the domain

1. In Vercel: **Project → Settings → Domains → Add** `doctorahmedelmasry.com` and `www.doctorahmedelmasry.com`.
2. Vercel shows the DNS records to create at your domain registrar, normally:
   - `A` record for `@` → `76.76.21.21`
   - `CNAME` record for `www` → `cname.vercel-dns.com`
3. Wait for DNS to update (minutes to a few hours). Vercel issues the HTTPS certificate automatically.
4. In Supabase → Authentication → URL Configuration, make sure *Site URL* is the final domain.

---

## Dashboard overview

| Section | What you can do |
| --- | --- |
| Overview | Counts of all content, latest messages |
| Services / Articles / Media / Home page / About us | Add, edit, hide/show, reorder, delete; rich text editor; images from the media library; SEO tags per page; Arabic and English |
| Pages | Texts and images of the fixed pages (home, about, CV, privacy, contact, books, tour…) |
| Settings | Logo, phones, e-mail, addresses, WhatsApp button, menu, footer, social links, Google Tag Manager, structured data |
| Messages | Contact-form inbox (read/unread, delete, reply on WhatsApp) |
| Media library | Upload, browse, copy link, delete images and PDFs |
| Users (owners) | Add/remove admins, change roles, reset passwords |

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | local development |
| `npm run build && npm start` | production build |
| `node scripts/import.mjs --skip-images` | re-import content only |
| `node scripts/create-admin.mjs <email> <password> [owner\|editor]` | create or reset an admin |
