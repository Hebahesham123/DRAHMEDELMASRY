#!/usr/bin/env node
/**
 * Loads the content copied from the old website into Supabase.
 *
 *   node scripts/import.mjs                 # content + images (images downloaded from the old site)
 *   node scripts/import.mjs --images ./dir  # use a local folder that contains ApplicationImages/
 *   node scripts/import.mjs --skip-images   # content only
 *   add  --revalidate https://your-site.com  to clear the website cache afterwards
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (reads .env.local).
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// --- tiny .env.local loader (no dependency) -------------------------------
for (const f of ['.env.local', '.env']) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });
const OLD_SITE = 'https://www.doctorahmedelmasry.com';
const BUCKET = 'media';

const seed = JSON.parse(fs.readFileSync(new URL('../supabase/seed/seed.json', import.meta.url), 'utf8'));

const ITEM_COLUMNS = ['type', 'lang', 'slug', 'title', 'excerpt', 'image', 'image_alt', 'detail_image', 'detail_image_alt',
  'detail_image_title', 'body_html', 'link', 'extra', 'seo', 'sort_order', 'featured', 'published'];

function toRow(it) {
  const row = { extra: {}, seo: {} };
  for (const [k, v] of Object.entries(it)) {
    if (ITEM_COLUMNS.includes(k)) row[k] = v;
    else row.extra[k] = v; // keep anything else (title_raw, link_title …)
  }
  row.extra = { ...row.extra, ...(it.extra || {}) };
  // every row in a batch must have the same columns, so fill the defaults
  for (const c of ['title', 'excerpt', 'image', 'image_alt', 'detail_image', 'detail_image_alt', 'detail_image_title', 'body_html', 'link']) row[c] ??= '';
  row.sort_order ??= 0;
  row.featured ??= false;
  row.published ??= true;
  return row;
}

async function check(label, p) {
  const { error } = await p;
  if (error) {
    console.error(label, error.message);
    process.exit(1);
  }
}

async function importContent() {
  for (const [lang, data] of Object.entries(seed.settings)) {
    await check('settings', sb.from('settings').upsert({ lang, data }));
  }
  console.log('settings ✓');
  await check('pages', sb.from('pages').upsert(seed.pages.map((p) => ({ key: p.key, lang: p.lang, data: p.data || {}, seo: p.seo || {} }))));
  console.log(`pages ✓ (${seed.pages.length})`);
  const rows = seed.items.map(toRow);
  for (let i = 0; i < rows.length; i += 50) {
    await check('items', sb.from('items').upsert(rows.slice(i, i + 50), { onConflict: 'type,slug' }));
  }
  console.log(`items ✓ (${rows.length})`);
}

// --- images -----------------------------------------------------------------
function collectImagePaths() {
  const set = new Set();
  const walk = (v) => {
    if (typeof v === 'string') {
      for (const m of v.matchAll(/\/?ApplicationImages\/[^"'<>)\n]+?\.(?:jpe?g|png|gif|webp|svg|pdf|mp4)/gi)) {
        set.add(decodeURIComponent(m[0].replace(/^\//, '')));
      }
    } else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(seed);
  return [...set];
}

function walkDir(dir, base = dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkDir(p, base, out);
    else out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out;
}

// Supabase Storage only accepts ASCII object names, but most original files have
// Arabic names. Each path segment is URL-encoded and "%" is swapped for "!".
// Keep in sync with src/lib/storage-key.ts
export function storageKey(p) {
  return p.split('/').map((seg) => encodeURIComponent(seg).replace(/!/g, '%21').replace(/%/g, '!')).join('/');
}

const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', pdf: 'application/pdf', mp4: 'video/mp4' };

async function importImages() {
  const local = opt('--images');
  const files = local ? walkDir(path.join(local, 'ApplicationImages')).map((f) => 'ApplicationImages/' + f) : collectImagePaths();
  console.log(`uploading ${files.length} files to storage bucket "${BUCKET}" …`);
  let ok = 0, failed = 0;
  const queue = [...files];
  const worker = async () => {
    while (queue.length) {
      const rel = queue.shift();
      try {
        let buf;
        if (local) buf = fs.readFileSync(path.join(local, rel));
        else {
          const r = await fetch(OLD_SITE + '/' + rel.split('/').map(encodeURIComponent).join('/'));
          if (!r.ok) throw new Error('HTTP ' + r.status);
          buf = Buffer.from(await r.arrayBuffer());
        }
        const ext = rel.split('.').pop().toLowerCase();
        const { error } = await sb.storage.from(BUCKET).upload(storageKey(rel), buf, { upsert: true, contentType: MIME[ext] || 'application/octet-stream' });
        if (error) throw error;
        ok++;
      } catch (e) {
        failed++;
        console.warn('  ✗', rel, e.message || e);
      }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  console.log(`images ✓ ${ok} uploaded, ${failed} failed`);
}

await importContent();
if (!flag('--skip-images')) await importImages();
const revalidateUrl = opt('--revalidate');
if (revalidateUrl) {
  const secret = process.env.REVALIDATE_SECRET || key;
  const r = await fetch(revalidateUrl.replace(/\/$/, '') + '/api/revalidate', { method: 'POST', headers: { authorization: `Bearer ${secret}` } });
  console.log(r.ok ? 'website cache cleared ✓' : `could not clear the website cache (HTTP ${r.status})`);
}
console.log('done');
