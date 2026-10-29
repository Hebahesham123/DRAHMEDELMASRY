import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PAGE_MAP } from '@/lib/content-types';
import { getAdminSession } from '@/lib/admin/auth';
import { asLang, isPlainObject } from '@/lib/admin/util';
import { PageForm } from '@/components/admin/PageForm';

type Props = { params: Promise<{ key: string }>; searchParams: Promise<{ lang?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params;
  return { title: PAGE_MAP[key]?.label || 'Page' };
}

export default async function EditPage({ params, searchParams }: Props) {
  const { key } = await params;
  const lang = asLang((await searchParams).lang);
  if (!PAGE_MAP[key]) notFound();
  const { supabase } = await getAdminSession();
  const { data } = await supabase.from('pages').select('data, seo, updated_at').eq('key', key).eq('lang', lang).maybeSingle();
  return (
    <PageForm
      key={`${key}-${lang}`}
      pageKey={key}
      lang={lang}
      exists={!!data}
      updatedAt={data?.updated_at ?? null}
      data={isPlainObject(data?.data) ? data.data : {}}
      seo={isPlainObject(data?.seo) ? data.seo : {}}
    />
  );
}
