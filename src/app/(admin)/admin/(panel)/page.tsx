import Link from 'next/link';
import type { Metadata } from 'next';
import { getAdminSession } from '@/lib/admin/auth';
import { ITEM_TYPES } from '@/lib/content-types';
import { formatDate } from '@/lib/admin/util';
import { Icon } from '@/components/admin/Icon';

export const metadata: Metadata = { title: 'Overview' };

export default async function Overview() {
  const { supabase, user } = await getAdminSession();
  const [{ data: rows }, { data: msgs }, { count: unread }] = await Promise.all([
    supabase.from('items').select('type, lang, published').limit(10000),
    supabase.from('messages').select('id, name, email, phone, message, created_at, lang').eq('is_read', false).order('created_at', { ascending: false }).limit(5),
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
  ]);

  const counts: Record<string, { ar: number; en: number; hidden: number }> = {};
  for (const r of rows || []) {
    const c = (counts[r.type] ||= { ar: 0, en: 0, hidden: 0 });
    if (r.lang === 'en') c.en++;
    else c.ar++;
    if (!r.published) c.hidden++;
  }

  return (
    <>
      <div className="page-head">
        <div className="titles">
          <h1>Welcome back</h1>
          <p>Signed in as {user?.email}. Choose what you want to update.</p>
        </div>
        <div className="actions">
          <Link className="btn" href="/admin/media">
            <Icon name="upload" /> Upload images
          </Link>
          <Link className="btn btn-primary" href="/admin/items/tip/new">
            <Icon name="plus" /> New surgery tip
          </Link>
        </div>
      </div>

      <div className="grid grid-stats" style={{ marginBottom: 20 }}>
        {ITEM_TYPES.map((t) => {
          const c = counts[t.type] || { ar: 0, en: 0, hidden: 0 };
          return (
            <Link key={t.type} href={`/admin/items/${t.type}`} className="card stat">
              <div className="num">{c.ar + c.en}</div>
              <div className="lbl">{t.label}</div>
              <div className="sub">
                Arabic {c.ar} · English {c.en}
                {c.hidden ? ` · ${c.hidden} hidden` : ''}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">
            <h2>Unread messages</h2>
            {!!unread && <span className="badge badge-red">{unread}</span>}
            <div className="spacer" />
            <Link href="/admin/messages" className="btn btn-sm">
              Open inbox
            </Link>
          </div>
          {msgs && msgs.length ? (
            <div className="table-wrap">
              <table className="table">
                <tbody>
                  {msgs.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <Link href={`/admin/messages?open=${m.id}`} style={{ color: 'inherit' }}>
                          <b>{m.name}</b>
                          <div className="small muted" dir="auto" style={{ maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m.message || m.phone || m.email}
                          </div>
                        </Link>
                      </td>
                      <td className="small muted" style={{ whiteSpace: 'nowrap' }}>
                        {formatDate(m.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">No unread messages 🎉</div>
          )}
        </div>
        <div className="card">
          <div className="card-head">
            <h2>Quick links</h2>
          </div>
          <div className="card-body stack">
            <Link href="/admin/pages/home?lang=ar" className="row">
              <Icon name="homepage" /> Edit the home page
            </Link>
            <Link href="/admin/pages/aboutus?lang=ar" className="row">
              <Icon name="about" /> Edit the about us page
            </Link>
            <Link href="/admin/settings?lang=ar" className="row">
              <Icon name="settings" /> Phones, addresses, menu, social links
            </Link>
            <Link href="/admin/items/bariatric" className="row">
              <Icon name="services" /> Bariatric surgeries
            </Link>
            <Link href="/admin/items/story" className="row">
              <Icon name="articles" /> Success stories
            </Link>
            <Link href="/admin/media" className="row">
              <Icon name="image" /> Media library
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
