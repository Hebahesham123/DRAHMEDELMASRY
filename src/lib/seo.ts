import type { Metadata } from 'next';
import type { Seo } from '@/lib/types';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.doctorahmedelmasry.com';

function absolute(u?: string) {
  if (!u) return undefined;
  if (/^https?:\/\//.test(u)) return u;
  return SITE + (u.startsWith('/') ? '' : '/') + encodeURI(u);
}

/** Builds Next.js metadata from the SEO fields stored with each page/item. */
export function buildMetadata(seo: Seo | undefined, fallback: { title?: string; description?: string; image?: string } = {}): Metadata {
  const s = seo || {};
  const title = s.title || fallback.title || '';
  const description = s.description ?? fallback.description;
  const ogType = s.og_type === 'article' ? 'article' : 'website';
  const md: Metadata = {
    title: { absolute: title },
    description: description || undefined,
    keywords: s.keywords || undefined,
    robots: { index: true, follow: true },
    openGraph: {
      title: s.og_title || title || undefined,
      siteName: s.og_site_name || undefined,
      url: s.og_url || undefined,
      description: s.og_description || description || undefined,
      type: ogType,
      images: s.og_image || fallback.image ? [{ url: absolute(s.og_image || fallback.image)! }] : undefined,
      ...(ogType === 'article' && s.article_tag ? { tags: [s.article_tag] } : {}),
    },
  };
  if (s.canonical) md.alternates = { canonical: s.canonical };
  return md;
}

/** JSON-LD blocks stored in seo.schema (several blocks separated by <!--split-->). */
export function schemaBlocks(seo: Seo | undefined): string[] {
  if (!seo?.schema) return [];
  return seo.schema
    .split('<!--split-->')
    .map((x) => x.trim())
    .filter(Boolean);
}
