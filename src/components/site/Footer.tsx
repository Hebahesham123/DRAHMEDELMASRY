import { Fragment } from 'react';
import type { Settings } from '@/lib/types';
import { href } from '@/lib/url';

export default function Footer({ s }: { s: Settings }) {
  const [phone1, ...otherPhones] = s.phones || [];
  return (
    <footer id="dsn_footer" className="dsn-footer mt-section  p-relative">
      <svg className="dsn-separator dsn-separator-up dsn-icon-assistant-color" width="100%" height="100%" viewBox="0 0 100 10" preserveAspectRatio="none">
        <path className="path-anim separator__path" data-dsn-to="M 0 0 C 40 0 55 0 100 0 L 0 0 Z" vectorEffect="non-scaling-stroke" d="M 0 0 C 40 16 75 10 100 0 L 0 0 Z"></path>
      </svg>
      <div className="footer-content p-relative container  border-top pt-section">
        <div className="d-grid grid-md-4 grid-sm-2">
          <div className="grid-col-1">
            <div className="dsn-logo main-logo">
              <div className="main-logo">
                <a href="/" data-dsn-text={s.footer_logo_text} className="custom-logo-link main-brand effect-ajax" rel="home">
                  <img className="custom-logo logo-light" src={s.logo_light} alt={s.footer_logo_text} />
                  <img className="custom-logo logo-dark" src={s.logo_dark} alt={s.footer_logo_text} />
                </a>
              </div>
            </div>
            <ul className="dsn-socials box-social mt-20">
              {(s.footer_socials || []).map((x, i) => (
                // the original markup has white space between the inline items
                <Fragment key={i}>
                {' '}
                <li>
                  <a href={x.url} target="_blank" rel="nofollow" className="init-color move-circle border-color-default" data-dsn="parallax">
                    <span className="dsn-icon">
                      <i className={x.icon}></i>
                    </span>
                    <span>{x.label}</span>
                  </a>
                </li>
                </Fragment>
              ))}
            </ul>
          </div>
          <div className="grid-col-2">
            <h4 className="subtitle p-relative line-shape  line-shape-after ">
              <span className="background-revere ">{s.footer_nav_title}</span>
            </h4>
            <div className="menu-footer-menu-container">
              <ul id="menu-footer-menu" className="menu">
                {(s.footer_nav || []).map((l, i) => (
                  <li key={i} className="menu-item">
                    <a href={href(l.href)} className="effect-ajax text-upper">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="grid-col-3">
            <h4 className="subtitle p-relative line-shape  line-shape-after ">
              <span className="background-revere ">{s.footer_contact_title}</span>
            </h4>
            <div className="col-contact">
              {phone1 && (
                <p>
                  <strong>T</strong> :{' '}
                  <a className="link-hover tel-dir" href={`tel:${phone1}`} data-hover-text={phone1}>
                    {phone1}
                  </a>
                </p>
              )}
              {otherPhones.map((p) => (
                <p key={p} className="footert2">
                  <a className="link-hover tel-dir" href={`tel:${p}`} data-hover-text={p}>
                    {p}
                  </a>
                </p>
              ))}
              <p className="over-hidden mt-10">
                <strong>E</strong> :{' '}
                <a className="link-hover" href={`mailto:${s.email}`} data-hover-text={s.email}>
                  {s.email}
                </a>
              </p>
            </div>
          </div>
          <div className="grid-col-4">
            <h4 className="subtitle p-relative line-shape  line-shape-after ">
              <span className="background-revere ">{s.footer_address_title}</span>
            </h4>
            <div className="col-address">
              {(s.addresses || []).map((a, i) => (
                <p key={i} className={i ? 'mt-10' : undefined}>
                  <a className="link-hover" href={a.map_footer || a.map_menu} target="_blank">
                    <strong>{a.name}</strong>
                    {a.footer_sep ?? ':'} {a.text}
                  </a>
                </p>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-bottom mt-60 pt-30 border-top pb-30 text-center">
          <p className="over-hidden" dangerouslySetInnerHTML={{ __html: s.footer_bottom_html || '' }} />
        </div>
      </div>
    </footer>
  );
}
