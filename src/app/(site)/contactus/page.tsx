import PageShell from '@/components/site/PageShell';
import type { PageHeaderData } from '@/components/site/PageHeader';
import ContactForm, { validateScript, type FormTexts } from '@/components/site/ContactForm';
import { getPage, getSessionLang, getSettings } from '@/lib/site-data';
import { buildMetadata } from '@/lib/seo';
import { deferred } from '@/lib/defer';

type ContactData = FormTexts & {
  page_header?: PageHeaderData; info_titles?: string[]; addresses?: { text: string; map: string }[] };

export async function generateMetadata() {
  return buildMetadata((await getPage('contactus', await getSessionLang())).seo);
}

function InfoItem({ icon, title, children }: { icon: string; title?: string; children: React.ReactNode }) {
  return (
    <div className="service-item p-relative grid-item style-box background-transparent">
      <div className="service-item-inner number-item h-100">
        <div className="dsn-icon">
          <i className={`fas ${icon} title-color-cus`} aria-hidden="true"></i>
        </div>
        <div className="service-content p-relative">
          <h4 className="service_title sm-title-block">{title}</h4>
          <div className="service_description mt-10 max-w570 dsn-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default async function Page() {
  const lang = await getSessionLang();
  const [page, s] = await Promise.all([getPage<ContactData>('contactus', lang), getSettings(lang)]);
  const d = page.data;
  const titles = d.info_titles || [];
  return (
    <PageShell lang={lang} header={d.page_header}>
      <div className="p-relative contact-form over-hidden section-padding">
        <div className="dsn-mask p-absolute w-70 left-0 top-0 h-100 background-section"></div>
        <div className="p-relative container d-grid grid-1-half" data-dsn-gap="30px 60px">
          <div className="box-form">
            <h2 className="title-h2">{d.form_title}</h2>
            <ContactForm f={d} lang={lang} page="contactus" />
          </div>
          <div className="box-info p-30 background-theme">
            <div className="icon-left dsn-icon-heading-color d-flex align-items-center h-100">
              <div className="d-grid dsn-service icon-left align-items-center">
                {(d.addresses || []).map((a, i) => (
                  <InfoItem key={i} icon="fa-map-marker-alt" title={titles[i]}>
                    <p>
                      <a className="link-hover d-block" href={a.map} target="_blank">
                        {a.text}
                      </a>
                    </p>
                  </InfoItem>
                ))}
                <InfoItem icon="fa-phone-volume" title={titles[2]}>
                  <p>
                    {(s.phones || []).map((p) => (
                      <a key={p} className="link-hover d-block tel-dir text-dir" href={`tel:${p}`} data-hover-text={p}>
                        {p}
                      </a>
                    ))}
                  </p>
                </InfoItem>
                <InfoItem icon="fa-envelope" title={titles[3]}>
                  <p>
                    <a className="link-hover" href={`mailto:${s.email}`} data-hover-text={s.email}>
                      {s.email}
                    </a>
                  </p>
                </InfoItem>
              </div>
            </div>
          </div>
        </div>
      </div>
      <script type="text/javascript" dangerouslySetInnerHTML={{ __html: deferred(validateScript(d)) }} />
    </PageShell>
  );
}
