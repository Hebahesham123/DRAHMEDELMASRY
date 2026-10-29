import BodyPage from '@/components/site/BodyPage';
import type { PageHeaderData } from '@/components/site/PageHeader';
import { getPage, getSessionLang } from '@/lib/site-data';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return buildMetadata((await getPage('cv', await getSessionLang())).seo);
}

export default async function Page() {
  const lang = await getSessionLang();
  const page = await getPage<{ body_html?: string; page_header?: PageHeaderData }>('cv', lang);
  return <BodyPage lang={lang} html={page.data.body_html || ''} header={page.data.page_header} />;
}
