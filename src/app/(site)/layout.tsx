import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { getRequestLang, getSettings } from '@/lib/site-data';
import SocialSide from '@/components/site/SocialSide';
import ThemeScripts from '@/components/site/ThemeScripts';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.doctorahmedelmasry.com'),
  icons: { shortcut: '/assets/img/logo-32x32.png' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

const CSS = {
  ar: ['/assets/css/plugins-ar.css', '/assets/css/style-ar.css', '/assets/css/MystyleAR.css'],
  en: ['/assets/css/plugins.css', '/assets/css/style.css', '/assets/css/MystyleEN.css'],
};

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const lang = await getRequestLang();
  const s = await getSettings(lang);
  const wa = s.whatsapp;
  const gtm = s.gtm_id;

  return (
    <html dir={lang === 'ar' ? 'rtl' : ''} lang={lang} suppressHydrationWarning>
      <head>
        {gtm ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function (w, d, s, l, i) { w[l] = w[l] || []; w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' }); var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true; j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f); })(window, document, 'script', 'dataLayer', ${JSON.stringify(gtm)});`,
            }}
          />
        ) : null}
        <link rel="alternate" hrefLang="x-default" href="https://www.doctorahmedelmasry.com/" />
        {wa?.number ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function () { var options = { whatsapp: ${JSON.stringify(wa.number)}, call_to_action: ${JSON.stringify(wa.cta)}, button_color: ${JSON.stringify(wa.color)}, position: ${JSON.stringify(wa.position)}, order: "whatsapp" }; var proto = document.location.protocol, host = "getbutton.io", url = proto + "//static." + host; var s = document.createElement('script'); s.type = 'text/javascript'; s.async = true; s.src = url + '/widget-send-button/js/init.js'; s.onload = function () { WhWidgetSendButton.init(host, proto, options); }; var x = document.getElementsByTagName('script')[0]; x.parentNode.insertBefore(s, x); })();`,
            }}
          />
        ) : null}
        {s.schema_global ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: s.schema_global }} /> : null}
        <script src="/assets/js/jquery-3.1.1.min.js"></script>
        <script type="text/javascript" src="/assets/js/jquery.validate.min.js?v=123456"></script>
        <script src="/assets/js/jquery.bootpag.min.js?v=123456"></script>
        <script src="/assets/js/pagination.js?v=123456"></script>
        {CSS[lang].map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        <link rel="stylesheet" href="/assets/css/Mystyle.css?v=6" />
        <link rel="stylesheet" href="/assets/css/pagination.css?v=123456" />
        <script
          dangerouslySetInnerHTML={{
            __html: `function scrollToElement(elementId) { const element = document.getElementById(elementId); if (element) { const offset = 350; window.scrollTo({ top: parseInt(element.offsetTop) + parseInt(offset), behavior: 'smooth' }); } }`,
          }}
        />
      </head>
      {/* data-l: the theme's page loader copies the next page's body class with a one-line
          pattern that breaks on React's single-line HTML; the line break makes it skip that step
          (the body class is the same on every page) */}
      <body className="v-dark bg-dots dsn-ajax" data-l={'\n'} suppressHydrationWarning>
        {gtm ? (
          <noscript>
            <iframe src={`https://www.googletagmanager.com/ns.html?id=${gtm}`} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }}></iframe>
          </noscript>
        ) : null}
        {children}
        <SocialSide s={s} />
        <ThemeScripts lang={lang} />
      </body>
    </html>
  );
}
