/** Helpers shared by the dashboard's server and client code (no secrets here). */
import { ITEM_TYPE_MAP, PAGE_MAP } from '@/lib/content-types';
import { storageKey } from '@/lib/storage-key';
import type { Lang } from '@/lib/types';

export const LANGS: Lang[] = ['ar', 'en'];
export const LANG_LABEL: Record<Lang, string> = { ar: 'Arabic', en: 'English' };
export const BUCKET = 'media';

export function asLang(v: unknown): Lang {
  return v === 'en' ? 'en' : 'ar';
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

/* ------------------------------------------------------------------ */
/* dotted field names ("extra.toc") on a record                        */
/* ------------------------------------------------------------------ */
export type Rec = Record<string, unknown>;

export function getPath(obj: Rec, name: string): unknown {
  return name.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Rec)[k] : undefined), obj);
}

export function setPath<T extends Rec>(obj: T, name: string, value: unknown): T {
  const [head, ...rest] = name.split('.');
  if (!rest.length) return { ...obj, [head]: value };
  const child = obj[head] && typeof obj[head] === 'object' && !Array.isArray(obj[head]) ? (obj[head] as Rec) : {};
  return { ...obj, [head]: setPath(child, rest.join('.'), value) };
}

export function isPlainObject(v: unknown): v is Rec {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/* ------------------------------------------------------------------ */
/* slugs and public URLs                                               */
/* ------------------------------------------------------------------ */

/** Suggest a URL slug from a title — keeps Arabic letters, drops URL-unsafe characters. */
export function slugify(title: string): string {
  return title
    .normalize('NFC')
    .replace(/[ً-ْـ]/g, '') // Arabic diacritics + tatweel
    .replace(/[?#%/\\&+=<>"'`{}|^[\]~:;,!*$@()؟،؛.]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .slice(0, 120);
}

/** Characters that would break a slug used in a URL path segment. */
export const SLUG_BAD_CHARS = /[/?#%\\]/;

export function autoSlug(lang: Lang, type: string) {
  return `${lang}-${type}-${Date.now()}`;
}

export function itemPublicPath(type: string, slug: string): string | null {
  const def = ITEM_TYPE_MAP[type];
  if (!def?.detailPath || !slug) return null;
  return `${def.detailPath}/${encodeURIComponent(slug)}`;
}

export function withClang(path: string, lang: Lang): string {
  if (lang === 'en' && path === '/?clang=2') return path;
  if (path.includes('clang=')) return path;
  return `${path}${path.includes('?') ? '&' : '?'}clang=${lang === 'en' ? 2 : 1}`;
}

export function listPublicPath(type: string, lang: Lang): string | null {
  const def = ITEM_TYPE_MAP[type];
  if (!def?.listPath) return null;
  return withClang(encodeURI(def.listPath[lang]), lang);
}

export function pagePublicPath(key: string, lang: Lang): string | null {
  const def = PAGE_MAP[key];
  if (!def) return null;
  const p = def.path[lang];
  if (p.startsWith('/?')) return p;
  return withClang(encodeURI(p), lang);
}

/* ------------------------------------------------------------------ */
/* media                                                               */
/* ------------------------------------------------------------------ */

export function publicStorageUrl(key: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  return `${base}/storage/v1/object/public/${BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

/** URL usable in an <img> inside the dashboard for a value stored in content. */
export function previewUrl(value: string): string {
  const v = (value || '').trim();
  if (!v) return '';
  if (/^(https?:)?\/\//i.test(v) || v.startsWith('data:') || v.startsWith('blob:')) return v;
  if (/^\/?ApplicationImages\//i.test(v)) {
    // original images live in the bucket under an ASCII-safe key
    const path = v.replace(/^\//, '');
    let decoded = path;
    try {
      decoded = decodeURI(path);
    } catch {}
    return publicStorageUrl(storageKey(decoded));
  }
  return v.startsWith('/') ? v : `/${v}`;
}

/** Value to store in content for a storage key: original site path for imported images, otherwise the public URL. */
export function contentValueForKey(key: string, decode: (k: string) => string): string {
  if (key.startsWith('ApplicationImages/')) return '/' + decode(key);
  return publicStorageUrl(key);
}

export function safeFileName(name: string): string {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const cleanBase =
    base
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9_-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'file';
  return ext ? `${cleanBase}.${ext}` : cleanBase;
}

export function uploadKey(fileName: string, now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `uploads/${y}/${m}/${now.getTime()}-${safeFileName(fileName)}`;
}

export const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|avif|bmp|ico)$/i;

/* ------------------------------------------------------------------ */
/* table of contents                                                   */
/* ------------------------------------------------------------------ */

export interface TocResult {
  html: string;
  entries: { id: string; text: string }[];
}

function stripTags(s: string) {
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds every <h2> in the HTML, makes sure it is wrapped in <span id="N"> (the
 * format used by the site: <span id="0"><h2>…</h2></span>) and returns the entries.
 * Existing wrappers are renumbered so the ids are 0..n-1 in document order.
 */
export function generateToc(html: string): TocResult {
  const entries: { id: string; text: string }[] = [];
  let n = 0;
  const re = /(<span\b[^>]*\bid\s*=\s*["']?[^"'\s>]*["']?[^>]*>\s*)?(<h2\b[^>]*>[\s\S]*?<\/h2>)(\s*<\/span>)?/gi;
  const out = html.replace(re, (_m, open: string | undefined, h2: string, close: string | undefined) => {
    const id = String(n++);
    const text = stripTags(h2);
    if (text) entries.push({ id, text });
    if (open && close) {
      const newOpen = open.replace(/\bid\s*=\s*(["']?)[^"'\s>]*\1/i, `id="${id}"`);
      return `${newOpen}${h2}${close}`;
    }
    return `${open || ''}<span id="${id}">${h2}</span>${close || ''}`;
  });
  return { html: out, entries };
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  // fixed time zone (the clinic's) so server and browser render the same text
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Cairo' });
}
