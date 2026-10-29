import type { Item, Lang } from '@/lib/types';
import { getItems, getPage, getSettings } from '@/lib/site-data';
import type { PageHeaderData } from './PageHeader';

async function headerOf(key: string, lang: Lang) {
  return ((await getPage(key, lang)).data as { page_header?: PageHeaderData }).page_header;
}
import { label } from '@/lib/labels';
import { pageOf } from '@/lib/text';
import PageShell from './PageShell';
import { deferred } from '@/lib/defer';

const ARROW = 'M21.883 12l-7.527 6.235.644.765 9-7.521-9-7.479-.645.764 7.529 6.236h-21.884v1h21.883z';

export async function SuccessStories({ lang }: { lang: Lang }) {
  const items = await getItems('story', lang);
  const s = await getSettings(lang);
  return (
    <PageShell lang={lang} header={await headerOf('successstories', lang)}>
      <div className="p-relative pt-section">
        <div className="container">
          <div className="p-relative dsn-style-classic box-image-transform">
            <div className="root-posts">
              <div className="dsn-posts dsn-post-type-classic h-350 d-grid grid-lg-3 grid-sm-2">
                {items.map((it, i) => {
                  const link = '../../SuccessStoryDetail/' + it.slug;
                  return (
                    <article key={it.id} className={`dsn-item-post grid-item over-hidden p-20 border-style bootpage_item bootpage${pageOf(i, 6)}`}>
                      <div className="box-content d-flex">
                        <a className="box-image-link bg-shadow" href={link} data-dsn-text="Success Stories">
                          <div className="box-image-bg before-z-index dsn-swiper-parallax-transform" data-overlay="2">
                            <img src={it.image} className="cover-bg-img" alt={it.image_alt || it.title} />
                          </div>
                        </a>
                        <div className="post-content dsn-bg p-relative z-index-1 d-flex flex-column">
                          <div className="post-title-info">
                            <h5 className="post-title dsn-bg title-block">
                              <a href={link} data-dsn-text="Success Stories">
                                {it.title}
                              </a>
                            </h5>
                          </div>
                          <div className="post-description-info">
                            <div className="d-flex mt-20 dsn-def-btn dsn-hover-icon ">
                              <a href={link} className="dsn-btn dsn-border border-color-default background-section has-icon-left ">
                                <span className="dsn-icon dsn-bg-before btn-icon-left heading-color z-index-1">
                                  <i className="fas fa-angle-right"></i>
                                </span>
                                <span className="title-btn p-relative z-index-1 heading-color goldencolor">{label(s, lang, 'more')}</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-center">
        <ul className="pagination  bootpag"></ul>
      </div>
      <script
        type="text/javascript"
        dangerouslySetInnerHTML={{
          __html: deferred(`var totalitems=${items.length}; pagination.init("hiddenbootpage","activebootpage",totalitems,6);`),
        }}
      />
    </PageShell>
  );
}

export async function SurgeryTips({ lang }: { lang: Lang }) {
  const items = await getItems('tip', lang);
  return (
    <PageShell lang={lang} header={await headerOf('surgerytips', lang)}>
      <div className="p-relative section-margin container">
        <div className="p-relative box-image-parallax dsn-style-cards">
          <div className="root-posts">
            <div className="dsn-posts dsn-post-type-cards box-image-normal d-grid grid-md-2 dsn-isotope use-filter v-dark-head" data-dsn-gap="60px">
              {items.map((it) => {
                const link = '../../SurgeryTipDetail/' + it.slug;
                return (
                  <article key={it.id} className="dsn-item-post grid-item over-hidden p-relative box-hover-image ">
                    <div className="box-content">
                      <div className="box-image-link bg-shadow" style={{ width: '100%' }}>
                        <div className="box-image-bg before-z-index dsn-swiper-parallax-transform pg-box" data-overlay="4">
                          <img className="cover-bg-img" src={it.image} alt={it.image_alt || it.title} title={it.image_alt || it.title} />
                        </div>
                      </div>
                      <div className="dsn-bg p-relative z-index-1 d-flex flex-column" style={{ width: '100%', height: '85px', paddingTop: '10px' }}>
                        <div className="post-title-info goldencolorLnk">
                          <a href={link} style={{ width: '85%' }}>
                            <h3 className="section_description mt-15 max-w570 ">{it.title}</h3>
                          </a>
                          <a className="dsn-post-link move-circle border-color-heading goldencolorLnk" href={link} rel="nofollow" data-dsn="parallax">
                            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                              <path className="arrow-after" d={ARROW} />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export async function Faqs({ lang }: { lang: Lang }) {
  const items = await getItems('faq', lang);
  return (
    <PageShell lang={lang} header={await headerOf('faqs', lang)}>
      <div className="root-blog container section-margin  dsn-blog">
        {items.map((it, i) => (
          <article key={it.id} className={`blog-item p-relative pt-50 pb-50 border-bottom bootpage_item bootpage${pageOf(i, 10)}`}>
            <div className="blog-item-inner p-relative">
              <div className="left-box">
                <a href={'/FAQDetail/' + it.slug} className="effect-ajax word-wrap" rel={(it.extra?.rel as string) || undefined}>
                  <h4 className="title-block">{it.title}</h4>
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}

function ytThumb(it: Item) {
  if (it.image) return it.image;
  const m = (it.link || '').match(/(?:embed\/|v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/sddefault.jpg` : '';
}

export async function Videos({ lang }: { lang: Lang }) {
  const items = await getItems('video', lang);
  return (
    <PageShell lang={lang} header={await headerOf('videos', lang)}>
      <div className="p-relative section-margin container">
        <div className="p-relative box-image-parallax dsn-style-cards">
          <div className="root-posts has-filter">
            <div className="dsn-posts dsn-post-type-cards box-image-normal d-grid grid-md-2 dsn-isotope use-filter v-dark-head" id="vedio-sort" data-dsn-gap="30px">
              {items.map((it) => (
                <article key={it.id} className="dsn-item-post grid-item over-hidden p-relative box-hover-image videos1">
                  <div className="box-content d-flex">
                    <div className="box-image-link bg-shadow">
                      <div className="box-image-bg before-z-index dsn-swiper-parallax-transform" data-overlay="4">
                        <img style={{ transform: 'unset' }} className="cover-bg-img vedioimgHeight" src={ytThumb(it)} alt="" />
                      </div>
                    </div>
                    <div className="post-content dsn-bg p-relative z-index-1 d-flex flex-column">
                      <div className="post-title-info postHeight">
                        <p className="section_description mt-15 max-w570">{it.title}</p>
                        <a className="dsn-post-link move-circle vid border-color-heading" href={it.link} target="_blank" rel="nofollow" data-dsn="parallax">
                          <i className="fas fa-play"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-center">
        <ul className="pagination  bootpag"></ul>
      </div>
    </PageShell>
  );
}

export async function Gallery({ lang }: { lang: Lang }) {
  const items = await getItems('gallery', lang);
  return (
    <PageShell lang={lang} header={await headerOf('gallery', lang)}>
      <div className="p-relative section-margin container">
        <div className="p-relative box-image-parallax dsn-style-cards">
          <div className="root-posts has-filter">
            <div className="dsn-posts dsn-post-type-cards box-image-normal d-grid grid-md-3 dsn-isotope use-filter v-dark-head" id="images-sort" data-dsn-gap="30px">
              {items.map((it) => (
                <div key={it.id} className="p-relative grid-item img-box-parallax before-z-index has-popup photos1 ">
                  <div
                    className="effect-popup before-z-index h-100"
                    data-src={it.image}
                    data-caption={it.title || 'Photo Title'}
                    data-fancybox={(it.extra?.fancybox as string) || '_1'}
                    data-cursor="open"
                    data-dsn-overlay="0"
                  >
                    <img src={it.image} alt={it.image_alt || ''} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-center">
        <ul className="pagination  bootpag"></ul>
      </div>
    </PageShell>
  );
}

export async function Testimonials({ lang }: { lang: Lang }) {
  const items = await getItems('testimonial', lang, { withBody: true });
  return (
    <PageShell lang={lang} header={await headerOf('testimonials', lang)}>
      <div className="p-relative pt-section">
        <div className="container">
          <div className="dsn-testimonials">
            <div className="testimonials-content">
              <div className="testimonial-inner">
                <div className="dsn-posts dsn-post-type-classic h-350 d-grid grid-lg-2 grid-sm-1">
                  {items.map((it, i) => (
                    <div key={it.id} className={`grid-item testimonial-inner-item border-style bootpage_item bootpage${pageOf(i, 6)}`}>
                      <div className="testimonial-item">
                        <div className="testimonial-content mb-25">
                          <div className="quote">
                            <p className="max-w750 testimonial-content text-center p-large" dangerouslySetInnerHTML={{ __html: it.body_html }} />
                          </div>
                        </div>
                        <div className="content-inner border-top justify-content-center">
                          <div className="d-flex align-items-center">
                            <div className="label box-text">
                              <h4 className="testimonial-name sm-title-block title-color-cus">{it.title}</h4>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
