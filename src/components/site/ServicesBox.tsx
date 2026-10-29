import type { Item } from '@/lib/types';

const PREFIX: Record<string, string> = {
  bariatric: '../../bariatricSurgeryDetail/',
  general: '../../GeneralSurgeryDetail/',
};

/** The "Services" box with five random service links shown next to articles. */
export default function ServicesBox({ title, links }: { title: string; links: Item[] }) {
  return (
    <div className="box-info p-30 background-theme">
      <div className="icon-left dsn-icon-heading-color d-flex align-items-center h-100">
        <div className="d-grid icon-left align-items-center">
          <div className="service-item p-relative grid-item style-box background-transparent">
            <div className="service-item-inner number-item h-100">
              <div className="service-content p-relative">
                <h4 className="service_title title-block">{title}</h4>
                <div className="service_description mt-20 max-w570 dsn-auto">
                  {links.map((l) => (
                    <p key={l.id} className="mt-10">
                      <a className="link-hover d-block" href={(PREFIX[l.type] || PREFIX.bariatric) + l.slug}>
                        {(l.extra?.title_raw as string) || l.title}
                      </a>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
