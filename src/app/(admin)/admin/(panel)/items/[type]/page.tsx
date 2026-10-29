import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAdminSession } from '@/lib/admin/auth';
import { ITEM_TYPE_MAP } from '@/lib/content-types';
import { asLang, listPublicPath } from '@/lib/admin/util';
import { ItemsTable, type ItemRow } from '@/components/admin/ItemsTable';
import { Icon } from '@/components/admin/Icon';

type Props = { params: Promise<{ type: string }>; searchParams: Promise<{ lang?: string; q?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  return { title: ITEM_TYPE_MAP[type]?.label || 'Content' };
}

export default async function ItemsPage({ params, searchParams }: Props) {
  const { type } = await params;
  const sp = await searchParams;
  const def = ITEM_TYPE_MAP[type];
  if (!def) notFound();
  const lang = asLang(sp.lang);
  const { supabase } = await getAdminSession();
  const [{ data, error }, { data: counts }] = await Promise.all([
    supabase
      .from('items')
      .select('id, slug, title, image, published, featured, sort_order, updated_at')
      .eq('type', type)
      .eq('lang', lang)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(5000),
    supabase.from('items').select('lang').eq('type', type).limit(10000),
  ]);
  const n = { ar: 0, en: 0 };
  for (const r of counts || []) n[asLang(r.lang)]++;
  const hasFeatured = def.fields.some((f) => f.name === 'featured');
  const hasImage = def.fields.some((f) => f.name === 'image');
  const listUrl = listPublicPath(type, lang);

  return (
    <>
      <div className="page-head">
        <div className="titles">
          <div className="crumbs">Content</div>
          <h1>
            {def.label} <span className="muted" style={{ fontWeight: 400 }} dir="rtl">· {def.labelAr}</span>
          </h1>
          <p>Drag rows (or use the arrows) to change the order on the website. Hidden items are not shown on the website.</p>
        </div>
        <div className="actions">
          {listUrl && (
            <a className="btn" href={listUrl} target="_blank" rel="noreferrer">
              <Icon name="external" /> View on site
            </a>
          )}
          <Link className="btn btn-primary" href={`/admin/items/${type}/new?lang=${lang}`}>
            <Icon name="plus" /> Add new
          </Link>
        </div>
      </div>
      {error && <div className="notice notice-error">{error.message}</div>}
      <ItemsTable
        key={lang}
        type={type}
        lang={lang}
        counts={n}
        initialQuery={sp.q || ''}
        rows={(data || []) as ItemRow[]}
        hasFeatured={hasFeatured}
        hasImage={hasImage}
        showUrl={def.slugInUrl}
      />
    </>
  );
}
