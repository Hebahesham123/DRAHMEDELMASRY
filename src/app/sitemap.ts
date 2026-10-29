import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { ITEM_TYPE_MAP, PAGES } from '@/lib/content-types';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.doctorahmedelmasry.com';
export const revalidate = 3600;

const url = (p: string) => SITE + encodeURI(p);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data } = await sb.from('items').select('type,slug,updated_at').eq('published', true).in('type', ['bariatric', 'general', 'story', 'tip', 'faq']);
  const out: MetadataRoute.Sitemap = [{ url: SITE + '/', priority: 1 }, { url: SITE + '/?clang=2', priority: 0.8 }];
  const seen = new Set<string>();
  for (const p of PAGES) {
    for (const path of [p.path.ar, p.path.en]) {
      if (path === '/' || path.startsWith('/?') || p.key === 'notfound' || seen.has(path)) continue;
      seen.add(path);
      out.push({ url: url(path), priority: 0.8 });
    }
  }
  for (const it of data ?? []) {
    const def = ITEM_TYPE_MAP[it.type];
    if (!def?.detailPath) continue;
    out.push({ url: url(`${def.detailPath}/${it.slug}`), lastModified: it.updated_at, priority: 0.64 });
  }
  return out;
}
