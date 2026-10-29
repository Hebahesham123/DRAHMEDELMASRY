import type { ReactNode } from 'react';
import type { Lang } from '@/lib/types';
import { getSettings } from '@/lib/site-data';
import SiteMenu from './SiteMenu';
import Footer from './Footer';
import PageHeader, { type PageHeaderData } from './PageHeader';

/** <main> wrapper shared by every page: menu, optional hero header, page content and footer. */
export default async function PageShell({
  lang,
  hero,
  header,
  children,
}: {
  lang: Lang;
  hero?: ReactNode;
  header?: PageHeaderData | null;
  children: ReactNode;
}) {
  const s = await getSettings(lang);
  return (
    <main id="main_root" className="main-root">
      <SiteMenu s={s} lang={lang} />
      {hero}
      {header ? <PageHeader h={header} /> : null}
      <div id="page_wrapper" className="wrapper">
        {children}
        <Footer s={s} />
      </div>
    </main>
  );
}
