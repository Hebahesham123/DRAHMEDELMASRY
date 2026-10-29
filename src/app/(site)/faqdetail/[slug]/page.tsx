import PageShell from '@/components/site/PageShell';
import { itemMetadata, loadItemOr404, type SlugParams } from '@/lib/detail';
import { schemaBlocks } from '@/lib/seo';
import { itemHeader } from '@/lib/site-data';

export const generateMetadata = ({ params }: SlugParams) => itemMetadata('faq', params);

export default async function Page({ params }: SlugParams) {
  const item = await loadItemOr404('faq', params);
  return (
    <PageShell lang={item.lang} header={await itemHeader(item)}>
      {schemaBlocks(item.seo).map((b, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: b }} />
      ))}
      <div className="root-blog">
        <div className="container ">
          <div className="dsn-posts">
            <div className="news-content mt-section">
              <div className="news-content-inner">
                <div className="post-content text-content" dangerouslySetInnerHTML={{ __html: `<p class="mt-50">  ${item.body_html}</p>` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
