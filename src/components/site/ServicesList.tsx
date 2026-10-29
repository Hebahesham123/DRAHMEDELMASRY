import { getItems, getPage } from '@/lib/site-data';
import type { PageHeaderData } from './PageHeader';
import type { Lang } from '@/lib/types';
import { pageOf } from '@/lib/text';
import PageShell from './PageShell';
import ServiceCard from './ServiceCard';

export default async function ServicesList({ type, lang }: { type: 'bariatric' | 'general'; lang: Lang }) {
  const items = await getItems(type, lang, { withBody: false });
  const page = await getPage<{ page_header?: PageHeaderData }>(type === 'bariatric' ? 'bariatricsurgeries' : 'generalsurgeries', lang);
  return (
    <PageShell lang={lang} header={page.data.page_header}>
      <div className="p-relative pt-section">
        <div className="container">
          <div className="p-relative dsn-style-classic box-image-transform">
            <div className="icon-top text-center">
              <div className="dsn-service h-350 d-grid grid-lg-3 grid-sm-2">
                {items.map((it, i) => (
                  <ServiceCard key={it.id} item={it} extraClass={`bootpage_item bootpage${pageOf(i, 6)}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
