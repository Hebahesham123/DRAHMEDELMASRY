import PageShell from '@/components/site/PageShell';
import type { PageHeaderData } from '@/components/site/PageHeader';
import { getPage, getSessionLang } from '@/lib/site-data';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return buildMetadata((await getPage('notfound', await getSessionLang())).seo);
}

export default async function Page() {
  const lang = await getSessionLang();
  const page = await getPage<{ text?: string; page_header?: PageHeaderData }>('notfound', lang);
  return (
    <PageShell lang={lang} header={page.data.page_header}>
      <section className="row">
        <div className="container" style={{ paddingTop: '50px' }}>
          <h1>{page.data.text || (lang === 'ar' ? 'لا توجد هذة البيانات' : "This item can't be found")}</h1>
        </div>
      </section>
    </PageShell>
  );
}
