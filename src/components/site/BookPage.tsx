import PageShell from './PageShell';
import type { PageHeaderData } from './PageHeader';
import ServicesBox from './ServicesBox';
import { getPage, getSettings, getSidebarLinks } from '@/lib/site-data';
import { label } from '@/lib/labels';
import type { Lang } from '@/lib/types';

type BookData = {
  page_header?: PageHeaderData;
  body_html?: string;
  sidebar_title?: string;
  button_text?: string;
  button_href_outer?: string;
  pdf?: string;
  pdf_label?: string;
  pdf_title?: string;
  pdf_hreflang?: string;
};

/** "Nutrition book" / "Together in Ramadan" download pages. */
export default async function BookPage({ pageKey, lang }: { pageKey: string; lang: Lang }) {
  const [page, s, links] = await Promise.all([getPage<BookData>(pageKey, lang), getSettings(lang), getSidebarLinks('bariatric', lang)]);
  const d = page.data;
  return (
    <PageShell lang={lang} header={d.page_header}>
      <div className="root-blog">
        <div className="container">
          <div className="d-grid grid-half-1 mt-50">
            <div className="grid-col-1">
              <ServicesBox title={d.sidebar_title || label(s, lang, 'services')} links={links} />
            </div>
            <div className="grid-col-2">
              <div className="dsn-posts">
                <div className="news-content">
                  <div className="news-content-inner">
                    <div className="post-content text-content" dangerouslySetInnerHTML={{ __html: `<p> ${d.body_html || ''}</p>` }} />
                  </div>
                </div>
              </div>
              <div className="dsn-icon-heading-color dsn-def-btn d-flex mt-50">
                <a
                  className="dsn-btn dsn-border border-color-default background-section has-icon-left"
                  href={d.pdf || d.button_href_outer}
                  target="_blank"
                  data-dsn-text={d.button_text}
                >
                  <span className="dsn-icon dsn-bg-before btn-icon-left heading-color z-index-1">
                    <i className="fas fa-angle-right" aria-hidden="true"></i>
                  </span>
                  <span className="title-btn p-relative z-index-1">{d.pdf_label}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
