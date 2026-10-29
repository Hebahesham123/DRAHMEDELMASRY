import 'server-only';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { publicClient } from '@/lib/supabase/public';
import { DETAIL_ROUTE_TYPES } from '@/lib/content-types';
import type { Item, Lang, PageRow, Settings } from '@/lib/types';

const ITEM_COLS =
  'id,type,lang,slug,title,excerpt,image,image_alt,detail_image,detail_image_alt,detail_image_title,body_html,link,extra,seo,sort_order,featured,published,created_at,updated_at';
const LIST_COLS = 'id,type,lang,slug,title,excerpt,image,image_alt,link,extra,sort_order,featured,body_html';

export const getSettings = cache(async (lang: Lang): Promise<Settings> => {
  const { data } = await publicClient().from('settings').select('data').eq('lang', lang).maybeSingle();
  return (data?.data ?? {}) as Settings;
});

export const getPage = cache(async <T = Record<string, unknown>>(key: string, lang: Lang): Promise<PageRow<T>> => {
  const { data } = await publicClient().from('pages').select('key,lang,data,seo').eq('key', key).eq('lang', lang).maybeSingle();
  return (data ?? { key, lang, data: {}, seo: {} }) as PageRow<T>;
});

export const getItems = cache(async (type: string, lang: Lang, opts: { withBody?: boolean } = {}): Promise<Item[]> => {
  const { data } = await publicClient()
    .from('items')
    .select(opts.withBody ? ITEM_COLS : LIST_COLS.replace(',body_html', ''))
    .eq('type', type)
    .eq('lang', lang)
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  // items marked "unlisted" have a page but are not shown in lists (as on the old site)
  return ((data ?? []) as unknown as Item[]).filter((i) => !i.extra?.unlisted);
});

/**
 * The old site encoded some characters in URLs: "?" as "QQQQ" (English) or "@@)"
 * (Arabic) and "." as "QQ)". Links on the site use the encoded form, but people
 * may also arrive with the plain characters, so both are matched.
 */
function slugVariants(slug: string): string[] {
  const s = slug;
  const out = new Set<string>([s, s.trim()]);
  const decoded = s.replace(/QQQQ/g, '?').replace(/@@\)/g, '?').replace(/QQ\)/g, '.');
  out.add(decoded);
  out.add(decoded.trim());
  return [...out];
}

function normalizeSlug(s: string) {
  return s.replace(/QQQQ/g, '?').replace(/@@\)/g, '?').replace(/QQ\)/g, '.').trim().toLowerCase();
}

export const getItemBySlug = cache(async (type: string, slug: string): Promise<Item | null> => {
  const sb = publicClient();
  const exact = await sb.from('items').select(ITEM_COLS).eq('type', type).eq('published', true).in('slug', slugVariants(slug)).limit(1);
  if (exact.data?.length) return exact.data[0] as unknown as Item;
  // fallback: case-insensitive / punctuation-insensitive match
  const { data } = await sb.from('items').select('id,slug').eq('type', type).eq('published', true);
  const want = normalizeSlug(slug);
  const hit = (data ?? []).find((r) => normalizeSlug(r.slug) === want);
  if (!hit) return null;
  const full = await sb.from('items').select(ITEM_COLS).eq('id', hit.id).single();
  return (full.data as unknown as Item) ?? null;
});

/** Five random links for the "Services" box on detail pages (random on every visit, like the old site). */
export async function getSidebarLinks(type: 'bariatric' | 'general', lang: Lang, excludeId?: string, count = 5) {
  const all = (await getItems(type, lang)).filter((i) => i.id !== excludeId);
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, count);
}

const BOOK_ROUTES: Record<string, Lang> = {
  download_free_book_nutrition_after_bariatric_surgeries_ar: 'ar',
  download_free_book_nutrition_after_bariatric_surgeries_en: 'en',
  download_free_book_nutrition_for_ramadan_surgeries_ar: 'ar',
  download_free_book_nutrition_for_ramadan_surgeries_en: 'en',
};

/** Language of the visitor's session (cookie set by ?clang=1 / ?clang=2). Arabic by default. */
export const getSessionLang = cache(async (): Promise<Lang> => {
  const h = await headers();
  const fromQuery = h.get('x-lang');
  if (fromQuery === 'ar' || fromQuery === 'en') return fromQuery;
  const c = (await cookies()).get('clang')?.value;
  return c === 'en' ? 'en' : 'ar';
});

/**
 * Language used to render the current request. Item pages always use the item's
 * own language (as on the old site), book pages use their URL suffix, everything
 * else uses the session language.
 */
export const getRequestLang = cache(async (): Promise<Lang> => {
  const h = await headers();
  const path = h.get('x-pathname') || '/';
  const segs = path.split('/');
  const first = decodeURIComponent(segs[1] || '').toLowerCase();
  if (BOOK_ROUTES[first]) return BOOK_ROUTES[first];
  const type = DETAIL_ROUTE_TYPES[first];
  if (type && segs.length >= 3) {
    let slug = segs.slice(2).join('/');
    try {
      slug = decodeURIComponent(slug);
    } catch {}
    const item = await getItemBySlug(type, slug);
    if (item) return item.lang;
  }
  return getSessionLang();
});

const LIST_PAGE_OF_TYPE: Record<string, string> = {
  bariatric: 'bariatricsurgeries',
  general: 'generalsurgeries',
  story: 'successstories',
  tip: 'surgerytips',
  faq: 'faqs',
};

/** Title banner for an item page; items created in the dashboard get one built from their list page. */
export async function itemHeader(item: Item) {
  type H = { crumb_label?: string; crumb_href?: string; title?: string; text_html?: string };
  const own = item.extra?.page_header as H | undefined;
  if (own) return own;
  const key = LIST_PAGE_OF_TYPE[item.type];
  const list = key ? ((await getPage(key, item.lang)).data as { page_header?: H }).page_header : undefined;
  return { crumb_label: list?.title, crumb_href: '', title: item.title, text_html: list?.text_html } as H;
}
