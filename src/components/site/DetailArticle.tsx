import type { Item } from '@/lib/types';
import { getSettings, getSidebarLinks, itemHeader } from '@/lib/site-data';
import { articleHtml } from '@/lib/article';
import { label } from '@/lib/labels';
import { schemaBlocks } from '@/lib/seo';
import ServicesBox from './ServicesBox';
import ContactBox from './ContactBox';
import PageShell from './PageShell';

/** Detail page for services, success stories and surgery tips. */
export default async function DetailArticle({ item }: { item: Item }) {
  const lang = item.lang;
  const s = await getSettings(lang);
  const sidebarType = item.type === 'general' ? 'general' : 'bariatric';
  const links = await getSidebarLinks(sidebarType, lang, item.id);
  const x = item.extra || {};
  const style = x.detail_image_style || (item.type === 'tip' ? 'w-100' : item.type === 'story' ? 'before_after' : 'plain');
  const outer = item.type === 'tip' ? 'news-content mt-section' : 'mt-section';

  let image = null;
  if (item.detail_image) {
    if (style === 'before_after')
      image = (
        <div className="before_after">
          <img src={item.detail_image} alt={item.detail_image_alt} />
        </div>
      );
    else
      image = (
        <img
          className={style === 'w-100' ? 'w-100' : undefined}
          src={item.detail_image}
          title={item.detail_image_title || undefined}
          alt={item.detail_image_alt}
        />
      );
  }

  return (
    <PageShell lang={lang} header={await itemHeader(item)}>
      {schemaBlocks(item.seo).map((b, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: b }} />
      ))}
      <div className="root-blog">
        <div className="container ">
          <div className="dsn-posts">
            <div className={outer}>
              <div className="news-content-inner">
                <div className="post-content">
                  {image}
                  <div className="d-grid grid-half-1 mt-50 row-cus-01">
                    <div className="grid-col-1 col-cus-01 box-01">
                      <ServicesBox title={x.sidebar_title || label(s, lang, 'services')} links={links} />
                    </div>
                    <div
                      className="grid-col-2 col-cus-02 box-03 text-content"
                      dangerouslySetInnerHTML={{ __html: articleHtml(item.body_html, x, label(s, lang, 'toc')) }}
                    />
                    {x.contact_box ? (
                      <div className="grid-col-1 col-cus-01 box-04">
                        <ContactBox {...x.contact_box} />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
