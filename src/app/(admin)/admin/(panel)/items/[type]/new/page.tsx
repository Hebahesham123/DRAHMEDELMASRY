import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ITEM_TYPE_MAP } from '@/lib/content-types';
import { asLang } from '@/lib/admin/util';
import { ItemForm } from '@/components/admin/ItemForm';

type Props = { params: Promise<{ type: string }>; searchParams: Promise<{ lang?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  return { title: `New · ${ITEM_TYPE_MAP[type]?.label || 'item'}` };
}

export default async function NewItemPage({ params, searchParams }: Props) {
  const { type } = await params;
  const { lang } = await searchParams;
  if (!ITEM_TYPE_MAP[type]) notFound();
  return <ItemForm type={type} item={null} defaultLang={asLang(lang)} />;
}
