import type { Lang } from '@/lib/types';
import PageShell from './PageShell';
import type { PageHeaderData } from './PageHeader';

/** CV / privacy policy layout: one block of rich text. */
export default function BodyPage({ lang, html, header }: { lang: Lang; html: string; header?: PageHeaderData }) {
  return (
    <PageShell lang={lang} header={header}>
      <div className="root-blog">
        <div className="container ">
          <div className="dsn-posts">
            <div className="news-content mt-section">
              <div className="news-content-inner">
                <div className="post-content text-content" dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
