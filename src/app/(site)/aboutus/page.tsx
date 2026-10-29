import { Fragment } from 'react';
import PageShell from '@/components/site/PageShell';
import type { PageHeaderData } from '@/components/site/PageHeader';
import ServicesBox from '@/components/site/ServicesBox';
import SwiperNav from '@/components/site/SwiperNav';
import { getItems, getPage, getSessionLang, getSettings, getSidebarLinks } from '@/lib/site-data';
import { buildMetadata } from '@/lib/seo';
import { label } from '@/lib/labels';

type AboutData = {
  page_header?: PageHeaderData;
  top_image?: string;
  top_image_alt?: string;
  top_title?: string;
  top_text?: string;
  sections?: { title: string; html: string }[];
  after_sections_html?: string;
  team_label?: string;
  team_title?: string;
  team_text?: string;
  why_label?: string;
  why_title?: string;
  why_right_title?: string;
  why_right_html?: string;
  experience_number?: string;
  experience_label_html?: string;
};

export async function generateMetadata() {
  return buildMetadata((await getPage('aboutus', await getSessionLang())).seo);
}

export default async function Page() {
  const lang = await getSessionLang();
  const [page, s, links, team, why] = await Promise.all([
    getPage<AboutData>('aboutus', lang),
    getSettings(lang),
    getSidebarLinks('bariatric', lang),
    getItems('team', lang, { withBody: true }),
    getItems('why_us', lang),
  ]);
  const d = page.data;
  return (
    <PageShell lang={lang} header={d.page_header}>
      <div className="box-under-bottom-img mb-section">
        <div className="img-box-parallax before-z-index dsn-animate dsn-effect-down h-v-80" data-dsn-triggerhook="bottom" data-dsn-grid="move-up" data-overlay="2">
          <img className="has-bigger-scale cover-bg-img has-direction" src={d.top_image} alt={d.top_image_alt} />
        </div>
        <div className="p-relative content container background-theme box-padding border-rdu text-center">
          <h2 className="title-block-lg text-upper">{d.top_title}</h2>
          <p className="dsn-heading-title mt-20 max-w750" dangerouslySetInnerHTML={{ __html: d.top_text || '' }} />
        </div>
      </div>
      <div className="p-relative content container pb-section">
        <div className="d-grid grid-half-1 mt-50">
          <div className="grid-col-1">
            <ServicesBox title={label(s, lang, 'services')} links={links} />
          </div>
          <div className="grid-col-2">
            {(d.sections || []).map((sec, i) => (
              <Fragment key={i}>
                <h4 className="title-block-lg mt-40 title-color-cus">{sec.title}</h4>
                <div className="text-content" dangerouslySetInnerHTML={{ __html: sec.html }} />
              </Fragment>
            ))}
            {d.after_sections_html ? <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: d.after_sections_html }} /> : null}
          </div>
        </div>
      </div>
      <div className="p-relative background-section section-padding">
        <div className="container">
          <div className="d-flex justify-content-center mb-70">
            <div className="sub-section-title text-center">
              <p className="description d-inline-block circle-before mb-10">{d.team_label}</p>
              <h2 className="title-h2 dsn-heading-title p-relative title-block-lg d-block title-color-cus">{d.team_title}</h2>
              <p className="max-w570 mt-20">{d.team_text}</p>
            </div>
          </div>
          <div className="elementor-widget-dsn_testimonial" data-widget_type="dsn_testimonial.default">
            <div className="dsn-testimonials dsn-swiper p-relative has-parallax-image" data-dsn-option='{"spaceBetween":30,"centeredSlides":false,"slidesPerView":2}'>
              <div className="testimonials-content">
                <div className="testimonial-inner">
                  <div className="swiper-container">
                    <div className="swiper-wrapper">
                      {team.map((t) => (
                        <div key={t.id} className="swiper-slide testimonial-inner-item border-style">
                          <div className="testimonial-item">
                            <div className="content-inner">
                              <div className="d-flex align-items-center">
                                <div className="avatar avatar-02 box-img dsn-auto">
                                  <img src={t.image} className="cover-bg-img" alt={t.title} />
                                </div>
                                <div className="label box-text">
                                  <h4 className="testimonial-name sm-title-block">{t.title}</h4>
                                  <h5 className="testimonial-position">{t.excerpt}</h5>
                                </div>
                              </div>
                            </div>
                            <div className="testimonial-content mt-25 border-top">
                              <div className="quote">
                                <p className="max-w750 testimonial-content testmonialHeight">{t.body_html}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <SwiperNav className="dsn-swiper-paginate d-flex p-relative w-100 h-100 mt-30 align-items-center container justify-content-between" type="bullets" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="about-section about-3 container d-grid grid-md-2 section-margin" data-dsn-gap="30px 60px">
        <div className="box-left">
          <div className="section-title d-flex">
            <div className="sub-section-title">
              <p className="description d-inline-block p-relative square-before mb-10 dsn-up">{d.why_label}</p>
              <h3 className="title-h2 dsn-heading-title p-relative title-block-lg d-block dsn-up">{d.why_title}</h3>
            </div>
          </div>
          <div className="dsn-accordion mt-30" role="tablist" data-dsn-iconsize="35px">
            <div className="accordion__wrapper">
              {why.map((w, i) => (
                <div key={w.id} className={i === 0 ? 'accordion__item active' : 'accordion__item'}>
                  <div className="accordion__question user-no-selection d-flex align-items-center accordion-icon">
                    <span className="dsn-icon">
                      <img src={w.image} alt={w.image_alt || w.title} />
                    </span>
                    <p className="sm-title-block tab-title title-color-cus" style={{ fontWeight: 600 }} role="tab" data-tab="0">
                      {w.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="box-right">
          <h4 className="title-h3 heading-color body-font text-upper">{d.why_right_title}</h4>
          <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: d.why_right_html || '' }} />
          <div className="experience mt-30">
            <span className="exp-number dsn-animate-number exp-font-2">
              <span className="animate-number">{d.experience_number}</span>
            </span>
            <h5 className="title-block mt-20" dangerouslySetInnerHTML={{ __html: d.experience_label_html || '' }} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
