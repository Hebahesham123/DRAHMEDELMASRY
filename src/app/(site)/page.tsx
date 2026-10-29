import PageShell from '@/components/site/PageShell';
import ServiceCard from '@/components/site/ServiceCard';
import SwiperNav from '@/components/site/SwiperNav';
import ContactForm, { type FormTexts } from '@/components/site/ContactForm';
import { getItems, getPage, getSessionLang, getSettings } from '@/lib/site-data';
import { buildMetadata } from '@/lib/seo';
import type { Item, Lang, Settings } from '@/lib/types';

type Btn = { label: string; href: string; text: string };
type HomeData = {
  hero_image?: string;
  hero_alt?: string;
  hero_title?: string;
  hero_words?: string[];
  hero_email_label?: string;
  hero_phone_label?: string;
  hero_phone?: string;
  scroll_text?: string;
  welcome_title_html?: string;
  welcome_text?: string;
  welcome_images?: string[];
  numbers_title?: string;
  numbers_text?: string;
  numbers_button?: Btn;
  news_title?: string;
  news_text?: string;
  news_button?: Btn;
  contact_title?: string;
  contact_text?: string;
  form?: FormTexts;
};

const ARROW = 'M21.883 12l-7.527 6.235.644.765 9-7.521-9-7.479-.645.764 7.529 6.236h-21.884v1h21.883z';

export async function generateMetadata() {
  return buildMetadata((await getPage('home', await getSessionLang())).seo);
}

function Hero({ d, s }: { d: HomeData; s: Settings }) {
  const words = d.hero_words || [];
  return (
    <header id="dsn_header" className="dsn-header-animation  dsn-full-header v-dark-head">
      <div className="entry-header p-relative over-hidden">
        <div id="hero_image" className="p-absolute dsn-hero-parallax-img over-hidden" data-dsn-ajax="img" data-overlay="3">
          <img src={d.hero_image} className="cover-bg-img transform-3d" alt={d.hero_alt} />
        </div>
        <div id="hero_content" className="d-flex p-relative h-100 dsn-hero-parallax-title container align-items-center">
          <div className="content p-relative ">
            <div className="intro-project w-100">
              <div className="intro-title-02">
                <div id="hero_title" className="mt-20">
                  <h1 className="ah-headline title-02 clip is-full-width">
                    <div>{d.hero_title}</div>
                    <span className="ah-words-wrapper">
                      {words.map((w, i) => (
                        <b key={i} className={i === 0 ? 'is-visible' : 'is-hidden'}>
                          {w}
                        </b>
                      ))}
                    </span>
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-head w-100 left-0 p-absolute bottom-0 z-index-2 pb-40">
          <div className="container d-grid grid-1-half">
            <ul className="dsn-grid-layout dsn-grid dsn-list w-100">
              <li className="list-item grid-item d-flex align-items-center">
                <p className="heading-color ">
                  <strong>{d.hero_email_label} </strong>{' '}
                  <a href={`mailto:${s.email}`} title={s.email} data-hover-text={s.email}>
                    {s.email}
                  </a>
                </p>
              </li>
              <li className="list-item grid-item d-flex align-items-center">
                <p className="heading-color ">
                  <strong>{d.hero_phone_label} </strong>{' '}
                  <a className="tel-dir" href={`tel:${d.hero_phone}`} title={d.hero_phone} data-hover-text={d.hero_phone}>
                    {d.hero_phone}
                  </a>
                </p>
              </li>
            </ul>
            <div className="social-icons-wrapper d-grid grid-4 justify-self-end" data-dsn-gap="20px" data-dsn-iconsize="17px">
              {(s.hero_socials || []).map((x, i) => (
                <span key={i} className="grid-item">
                  <a className="dsn-icon" href={x.url} target="_blank" rel="nofollow">
                    <i className={x.icon} aria-hidden="true"></i>
                  </a>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <a href="#page_wrapper" rel="nofollow" className="dsn-scroll-bottom" data-dsn-option='{"ease": "power4.inOut" , "duration" : 1.5}'>
        <div className="text">{d.scroll_text}</div>
      </a>
    </header>
  );
}

function SectionButton({ b }: { b?: Btn }) {
  if (!b) return null;
  return (
    <div className="dsn-def-btn dsn-hover-icon dsn-icon-heading-color mt-30 d-flex">
      <a className="dsn-btn dsn-border border-color-default background-section effect-ajax has-icon-left" href={b.href} data-dsn-text={b.text}>
        <span className="dsn-icon dsn-bg-before btn-icon-left heading-color z-index-1">
          <i className="fas fa-angle-right" aria-hidden="true"></i>
        </span>
        <span className="title-btn p-relative z-index-1">{b.label}</span>
      </a>
    </div>
  );
}

function HomeCard({ c }: { c: Item }) {
  const x = c.extra || {};
  const imgLink = (x.image_link as string) || c.link;
  return (
    <article className={`dsn-item-post grid-item ${(x.article_class as string) || ''} over-hidden p-relative box-hover-image`.replace(/\s+/g, ' ')}>
      <div className="box-content d-flex">
        <a className="effect-ajax box-image-link bg-shadow" href={imgLink} data-dsn-ajax={c.title} title={c.title}>
          <div className="box-image-bg before-z-index dsn-swiper-parallax-transform" data-overlay={(x.overlay as string) || '2'}>
            <img className="cover-bg-img" src={c.image} alt={c.image_alt || c.title} />
          </div>
        </a>
        <div className="post-content dsn-bg p-relative z-index-1 d-flex flex-column">
          <div className="post-title-info">
            {x.category ? (
              <div className="post-meta max-w750">
                <div className="p-relative d-inline-block dsn-category dsn-bg metas mb-10 entry-meta">
                  <span data-separator="&">{x.category as string}</span>
                </div>
              </div>
            ) : null}
            <h2 className={`post-title title-block ${(x.title_class as string) || ''}`.trim()}>
              <a href={c.link} className="effect-ajax" data-dsn-ajax={c.title}>
                {c.title}
              </a>
              <a href={c.link} className="effect-ajax dsn-post-link move-circle border-color-heading" data-dsn="parallax" data-dsn-ajax={c.title}>
                <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path className="arrow-after" d={ARROW} />
                </svg>
              </a>
            </h2>
            <p className="section_description mt-15 max-w570 ">{c.excerpt}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function truncate(t: string, n = 100) {
  const clean = t.replace(/\.\.\.$/, '');
  return clean.length > n ? clean.slice(0, n) + '...' : t;
}

async function Home({ lang }: { lang: Lang }) {
  const [page, s, services, skills, news, cards] = await Promise.all([
    getPage<HomeData>('home', lang),
    getSettings(lang),
    getItems('bariatric', lang),
    getItems('home_skill', lang),
    getItems('news', lang),
    getItems('home_card', lang),
  ]);
  const d = page.data;
  const featured = services
    .filter((i) => i.featured)
    .sort((a, b) => Number(a.extra?.home_order ?? 99) - Number(b.extra?.home_order ?? 99));
  const welcomeImgs = d.welcome_images || [];

  return (
    <PageShell lang={lang} hero={<Hero d={d} s={s} />}>
      <div className="about-section about-resume container section-margin text-center">
        <div className="mb-70">
          <h2 className="title-h2 text-upper title-color-cus" dangerouslySetInnerHTML={{ __html: d.welcome_title_html || '' }} />
          <p className="max-w750 mt-20">{d.welcome_text}</p>
        </div>
        <div className="d-grid grid-md-2 d-grid-no-space box-img">
          <div
            className="img-left"
            data-dsn-animation='{"to":{"rotation":"-15","y":"60"},"option":{"scrub":"1"},"responsive":["desktop","tablet"],"to_tablet":{"rotation":"-15"}}'
          >
            <img src={welcomeImgs[0] || '/assets/img/home-2.jpg'} alt="" />
          </div>
          <div
            className="img-right"
            data-dsn-animation='{"to":{"rotation":"9","y":0},"option":{"scrub":"1"},"responsive":["desktop","tablet"],"to_tablet":{"rotation":"1"}}'
          >
            <img src={welcomeImgs[1] || '/assets/img/home-3.jpg'} alt="" />
          </div>
        </div>
      </div>

      <div className="container section-margin pt-section border-top">
        <div className="section-title mb-70 text-center"></div>
        <div className="icon-top dsn-icon-theme-color text-center">
          <div className="dsn-service">
            <div className="dsn-swiper p-relative has-parallax-image" data-dsn-option='{"slidesPerView":3,"centeredSlides":false,"autoplay":true,"spaceBetween":30}'>
              <div className="swiper-container">
                <div className="swiper-wrapper">
                  {featured.map((it) => (
                    <ServiceCard key={it.id} item={it} />
                  ))}
                </div>
              </div>
              <SwiperNav className="dsn-swiper-paginate d-flex p-relative w-100 h-100 mt-50 align-items-center dsn-container justify-content-between" type="progressbar" />
            </div>
          </div>
        </div>
      </div>

      <div className="container section-margin pt-section border-top d-grid grid-md-2" data-dsn-gap="30px 120px">
        <div className="box-left p-relative pinned-scroll" data-dsn-option='{"end":"250"}'>
          <div className="pinned-element">
            <h2 className="title-h2 text-upper title-color-cus" dangerouslySetInnerHTML={{ __html: d.numbers_title || '' }} />
            <p className="max-w750 mt-20">{d.numbers_text}</p>
            <SectionButton b={d.numbers_button} />
          </div>
        </div>
        <div className="box-right">
          <div className="dsn-skills d-grid">
            {skills.map((k) => (
              <div key={k.id} className="dsn-skills-item grid-item">
                <div className="skills-inner">
                  <h6 className="dsn-title-award sm-title-block mb-15">{k.title}</h6>
                  <div className="bar-progress">
                    <span className="fill dsn-animate-skill box-shadow background-section" data-dsn-width={(k.extra?.width as string) || '100%'}>
                      <span className="dsn-number-award number sm-title-block">0%</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container section-margin pt-section border-top d-grid grid-md-2" data-dsn-gap="30px 120px">
        <div className="box-left p-relative pinned-scroll" data-dsn-option='{"end":"250"}'>
          <div className="pinned-element">
            <h2 className="title-h2 text-upper title-color-cus" dangerouslySetInnerHTML={{ __html: d.news_title || '' }} />
            <p className="max-w750 mt-20">{d.news_text}</p>
            <SectionButton b={d.news_button} />
          </div>
        </div>
        <div className="box-right">
          <div className="dsn-resume">
            {news.map((n) => (
              <div key={n.id} className="resume-item">
                <h5 className="sm-title-block resume-title mb-15 goldencolor">{n.title}</h5>
                <h6 className="resume-position">{n.extra?.date_text as string}</h6>
                <div className="resume-description mt-10">
                  <p>{truncate(n.excerpt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-relative container section-margin pt-section border-top v-dark-head">
        <div className="box-image-transform dsn-style-cards ">
          <div className="root-posts">
            <div className="d-grid grid-md-2 dsn-posts dsn-post-type-cards box-image-normal">
              {cards.map((c) => (
                <HomeCard key={c.id} c={c} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container pt-section d-grid grid-md-2" data-dsn-gap="30px 120px">
        <div className="box-left p-relative pinned-scroll" data-dsn-option='{"end":"250"}'>
          <div className="pinned-element">
            <h2 className="title-h2 text-upper title-color-cus" dangerouslySetInnerHTML={{ __html: d.contact_title || '' }} />
            <p className="max-w750 mt-20">{d.contact_text}</p>
          </div>
        </div>
        <div className="box-right">
          <h2 className="title-h2">{d.form?.form_title}</h2>
          <ContactForm f={d.form || {}} lang={lang} page="home" />
        </div>
      </div>
    </PageShell>
  );
}

export default async function Page() {
  return <Home lang={await getSessionLang()} />;
}
