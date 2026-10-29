import type { CSSProperties } from 'react';
import type { Settings } from '@/lib/types';

/** Floating "Follow Us" social bar + cursor + background line (end of <body> on the old site). */
export default function SocialSide({ s }: { s: Settings }) {
  const list = s.side_socials || [];
  return (
    <>
      <div id="dsn_cursor" className="ball"></div>
      <div id="dsn_cursor_inner" className="ball"></div>
      <div className="social-side d-flex align-items-center flex-column justify-content-center">
        <ul className="socials d-flex flex-column-reverse">
          {list.map((x, i) => (
            <li key={i} style={{ '--dsn-index-animate': i < 2 ? i : i === list.length - 1 ? 3 : 2 } as CSSProperties}>
              <a href={x.url} target="_blank" rel="nofollow">
                <i className={x.icon} aria-hidden="true"></i>
                <span>{x.label}</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="icon">{s.side_title}</div>
      </div>
      <div id="line_head">
        <span className="container"></span>
      </div>
    </>
  );
}
