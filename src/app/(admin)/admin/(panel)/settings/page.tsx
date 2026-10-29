import type { Metadata } from 'next';
import { getAdminSession } from '@/lib/admin/auth';
import { asLang, isPlainObject } from '@/lib/admin/util';
import { SettingsForm } from '@/components/admin/SettingsForm';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = asLang((await searchParams).lang);
  const { supabase } = await getAdminSession();
  const { data } = await supabase.from('settings').select('data, updated_at').eq('lang', lang).maybeSingle();
  return <SettingsForm key={lang} lang={lang} data={isPlainObject(data?.data) ? data.data : {}} updatedAt={data?.updated_at ?? null} />;
}
