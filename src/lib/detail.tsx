import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getItemBySlug } from '@/lib/site-data';
import { buildMetadata } from '@/lib/seo';

export type SlugParams = { params: Promise<{ slug: string }> };

export function decodeSlug(raw: string) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Loads the item for a detail URL, or sends the visitor to /ItemNotFound (like the old site). */
export async function loadItemOr404(type: string, params: SlugParams['params']) {
  const { slug } = await params;
  const item = await getItemBySlug(type, decodeSlug(slug));
  if (!item) permanentRedirect('/ItemNotFound');
  return item;
}

export async function itemMetadata(type: string, params: SlugParams['params']): Promise<Metadata> {
  const { slug } = await params;
  const item = await getItemBySlug(type, decodeSlug(slug));
  if (!item) return {};
  return buildMetadata(item.seo, { title: item.title, image: item.detail_image || item.image });
}
