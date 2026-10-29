import { Fragment, type CSSProperties } from 'react';
import type { Settings } from '@/lib/types';
import { href } from '@/lib/url';
import { label } from '@/lib/labels';

const BACK_ARROW =
  'M382.688,182.686H59.116l77.209-77.214c6.764-6.76,6.764-17.726,0-24.485c-6.764-6.764-17.73-6.764-24.484,0L5.073,187.757 c-6.764,6.76-6.764,17.727,0,24.485l106.768,106.775c3.381,3.383,7.812,5.072,12.242,5.072c4.43,0,8.861-1.689,12.242-5.072 c6.764-6.76,6.764-17.726,0-24.484l-77.209-77.218h323.572c9.562,0,17.316-7.753,17.316-17.315 C400.004,190.438,392.251,182.686,382.688,182.686z';

/** The full-screen menu header (identical markup to the original site). */
export default function SiteMenu({ s, lang }: { s: Settings; lang: 'ar' | 'en' }) {
  const otherLang = lang === 'ar' ? 2 : 1;
  return (
    <header id="site_menu_header" className="site-header  dsn-container d-none dsn-hamburger">
      <div className="main-logo">
        <a href="/" data-dsn-text={s.logo_text} className="custom-logo-link main-brand effect-ajax" rel="home" aria-current="page">
          <img src={s.logo_light} className="custom-logo logo-light" alt={s.logo_text} />
          <img src={s.logo_dark} className="custom-logo logo-dark" alt={s.logo_text} />
        </a>
      </div>
      <div className="d-flex">
        <nav className="main-navigation ">
          <div className="menu-cover-title header-container dsn-container">{s.menu_title}</div>
          <ul id="dsn-primary-list" className="primary-nav h4">
            {(s.menu || []).map((m, i) =>
              m.children?.length ? (
                <li key={i} className="nav-item has-sub-menu">
                  <a title={m.label} href="#0">
                    <span className="overflow ">{m.label}</span>
                  </a>
                  <ul className="nav-item">
                    <li className="dsn-back">
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30px" viewBox="0 0 400.004 400.004" xmlSpace="preserve">
                          <g>
                            <path d={BACK_ARROW} />
                          </g>
                        </svg>
                        <span className="text-toggle-back">
                          <span className="text-name">{m.label}</span>
                          <span className="text-back">{label(s, lang, 'back')}</span>
                        </span>
                      </span>
                    </li>
                    {m.children.map((c, j) => (
                      <li key={j} className="nav-item ">
                        <a title={c.label} href={href(c.href)} data-dsn-text={c.label}>
                          <span className="overflow">{c.label}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={i} className="nav-item ">
                  <a title={m.label} href={href(m.href)} data-dsn-text={m.label}>
                    <span className="overflow">{m.label}</span>
                  </a>
                </li>
              ),
            )}
          </ul>
          <div className="container-content  d-flex flex-column justify-content-center section-margin-02">
            <div className="nav__info">
              <div className="nav-content">
                <h5 className="sm-title-block mb-10">{s.address_title}</h5>
                {(s.addresses || []).map((a, i) => (
                  <p key={i} className={i ? 'mt-10' : undefined}>
                    <a className="link-hover d-block" href={a.map_menu} target="_blank">
                      <strong>{a.name}</strong> : {a.text}
                    </a>
                  </p>
                ))}
              </div>
              <div className="nav-content mt-30">
                <h5 className="sm-title-block mb-10">{s.contact_title}</h5>
                {(s.phones || []).map((p) => (
                  <p key={p} className="links over-hidden mb-1">
                    <a className="link-hover d-block tel-dir text-dir" href={`tel:${p}`} data-hover-text={p}>
                      {p}{' '}
                    </a>
                  </p>
                ))}
                <p className="mt-10 links over-hidden">
                  <a className="link-hover" href={`mailto:${s.email}`} data-hover-text={s.email}>
                    {s.email}
                  </a>
                </p>
              </div>
            </div>
            <div className="nav-social nav-content mt-30">
              <div className="nav-social-inner p-relative">
                <h5 className="sm-title-block mb-10">{s.follow_title}</h5>
                <ul style={{ '--dsn-li-name': 'dsn6' } as CSSProperties}>
                  {(s.menu_socials || []).map((x, i) => (
                    <Fragment key={i}>
                      {' '}
                      <li style={{ '--dsn-li-index': i } as CSSProperties}>
                        <a href={x.url} target="_blank" rel="nofollow noopener noreferrer">
                          {x.label}
                        </a>
                      </li>
                    </Fragment>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </nav>
        <div id="navbar_toggle" className="navbar-toggle">
          <div className="toggle-icon">
            <div className="toggle-line"></div>
            <div className="toggle-line"></div>
            <div className="toggle-line"></div>
          </div>
          <div className="toggle-text">
            <div className="text-menu">{s.toggle?.menu}</div>
            <div className="text-open">{s.toggle?.open}</div>
            <div className="text-close">{s.toggle?.close}</div>
          </div>
        </div>
        <div className="main-lang">
          <a href={`/?clang=${otherLang}`} data-dsn-text={s.lang_switch?.text} rel={s.lang_switch?.text}>
            {s.lang_switch?.label}
          </a>
        </div>
      </div>
      <div className="bg-load background-main"></div>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="bg-load dsn-svg-transition">
        <path vectorEffect="non-scaling-stroke" d="M 0 100 V 100 Q 50 100 100 100 V 100 z" />
      </svg>
    </header>
  );
}
