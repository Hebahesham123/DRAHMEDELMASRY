export interface PageHeaderData {
  crumb_label?: string;
  crumb_href?: string;
  title?: string;
  text_html?: string;
}

/** Title banner at the top of inner pages. */
export default function PageHeader({ h }: { h: PageHeaderData }) {
  return (
    <header className="p-relative pt-header bg-dots">
      <div className="hero-content container">
        {h.crumb_label ? (
          <p className="p2n-heading-title d-inline-block circle-before">
            <a href={h.crumb_href || ''} className="effect-ajax" data-p2n-text={h.crumb_label}>
              {h.crumb_label}
            </a>
          </p>
        ) : null}
        <h1 className="title-head mt-20 text-upper title-color-cus">{h.title}</h1>
        {h.text_html !== undefined && h.text_html !== null ? (
          <>
            <p className="max-w750 mt-20" dangerouslySetInnerHTML={{ __html: h.text_html }} />
            <br />
          </>
        ) : null}
      </div>
    </header>
  );
}
