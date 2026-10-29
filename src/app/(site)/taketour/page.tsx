import PageShell from '@/components/site/PageShell';
import type { PageHeaderData } from '@/components/site/PageHeader';
import { getPage, getSessionLang } from '@/lib/site-data';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata() {
  return buildMetadata((await getPage('taketour', await getSessionLang())).seo);
}

export default async function Page() {
  const lang = await getSessionLang();
  const page = await getPage<{ iframe_src?: string; page_header?: PageHeaderData }>('taketour', lang);
  return (
    <PageShell lang={lang} header={page.data.page_header}>
      <div className="root-blog">
        <div className="container ">
          <div className="dsn-posts">
            <div className="news-content mt-section">
              <div className="news-content-inner">
                <div className="post-content">
                  <iframe src={page.data.iframe_src} className="w-100 hv-80" allowFullScreen loading="lazy"></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
