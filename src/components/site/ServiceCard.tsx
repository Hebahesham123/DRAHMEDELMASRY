import type { Item } from '@/lib/types';
import { excerptOf } from '@/lib/text';

const DETAIL: Record<string, string> = {
  bariatric: '../../bariatricsurgeryDetail/',
  general: '../../GeneralSurgeryDetail/',
};

/** Service card used on the home slider and on the services listing pages. */
export default function ServiceCard({ item, extraClass = '' }: { item: Item; extraClass?: string }) {
  const link = (DETAIL[item.type] || DETAIL.bariatric) + item.slug;
  const t = (item.extra?.link_title as string) || item.title;
  const title = (item.extra?.title_raw as string) || item.title;
  const excerpt = item.excerpt || excerptOf(item.body_html || '');
  return (
    <div className={`swiper-slide service-item p-relative grid-item style-box ${extraClass}`}>
      <div className="service-item-inner border-style number-item h-100 ">
        <a href={link} className="effect-ajax" title={t} data-dsn-ajax={t}>
          <div data-overlay="1">
            <img src={item.image} alt={item.image_alt || t} />
          </div>
        </a>
        <div className="service-content p-relative serviceHeight ">
          <a href={link} className="effect-ajax" title={t} data-dsn-ajax={t}>
            <h4 className="service_title  title-block goldencolor">{title}</h4>
          </a>
          <div className="service_description mt-10 max-w570 dsn-auto">
            <p>{excerpt}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
