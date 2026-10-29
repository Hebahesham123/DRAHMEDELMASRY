import ServicesList from '@/components/site/ServicesList';
import { getPage, getSessionLang } from '@/lib/site-data';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata() {
  const lang = await getSessionLang();
  return buildMetadata((await getPage('generalsurgeries', lang)).seo);
}

export default async function Page() {
  const lang = await getSessionLang();
  return <ServicesList type="general" lang={lang} />;
}
