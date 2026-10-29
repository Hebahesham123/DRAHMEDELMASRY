import Link from 'next/link';
import type { Metadata } from 'next';
import { getAdminSession } from '@/lib/admin/auth';
import { PAGES } from '@/lib/content-types';
import { formatDate, pagePublicPath } from '@/lib/admin/util';
import { Icon } from '@/components/admin/Icon';

export const metadata: Metadata = { title: 'Pages' };

export default async function PagesList() {
  const { supabase } = await getAdminSession();
  const { data } = await supabase.from('pages').select('key, lang, updated_at');
  const at = (key: string, lang: string) => data?.find((r) => r.key === key && r.lang === lang)?.updated_at;
  return (
    <>
      <div className="page-head">
        <div className="titles">
          <h1>Pages</h1>
          <p>Texts, images and SEO of the fixed pages of the website. Listing pages only have SEO settings.</p>
        </div>
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Address</th>
              <th>Arabic</th>
              <th>English</th>
            </tr>
          </thead>
          <tbody>
            {PAGES.map((p) => (
              <tr key={p.key}>
                <td className="title-cell">
                  <Link href={`/admin/pages/${p.key}?lang=ar`}>{p.label}</Link>
                  <div className="slug">{p.fields.length ? `${p.fields.length} fields + SEO` : 'SEO only'}</div>
                </td>
                <td className="small muted" dir="auto">
                  <a href={pagePublicPath(p.key, 'ar') || '#'} target="_blank" rel="noreferrer" className="muted">
                    {p.path.ar} <Icon name="external" size={12} />
                  </a>
                </td>
                {(['ar', 'en'] as const).map((l) => (
                  <td key={l}>
                    <Link className="btn btn-sm" href={`/admin/pages/${p.key}?lang=${l}`}>
                      <Icon name="edit" size={14} /> Edit {l.toUpperCase()}
                    </Link>
                    <div className="small muted">{at(p.key, l) ? formatDate(at(p.key, l)) : 'not created yet'}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
