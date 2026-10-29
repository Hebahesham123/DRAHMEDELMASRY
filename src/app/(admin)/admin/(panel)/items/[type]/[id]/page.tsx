import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { ITEM_TYPE_MAP } from '@/lib/content-types';
import { getAdminSession } from '@/lib/admin/auth';
import { ItemForm } from '@/components/admin/ItemForm';
import type { Item } from '@/lib/types';

type Props = { params: Promise<{ type: string; id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  return { title: `Edit · ${ITEM_TYPE_MAP[type]?.label || 'item'}` };
}

export default async function EditItemPage({ params }: Props) {
  const { type, id } = await params;
  if (!ITEM_TYPE_MAP[type] || !UUID.test(id)) notFound();
  const { supabase } = await getAdminSession();
  const { data } = await supabase.from('items').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();
  if (data.type !== type) redirect(`/admin/items/${data.type}/${id}`);
  return <ItemForm key={data.id} type={type} item={data as Item} defaultLang={data.lang} />;
}
