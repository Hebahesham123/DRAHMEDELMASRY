import type { Metadata } from 'next';
import { getAdminSession } from '@/lib/admin/auth';
import { MessagesInbox, type Message } from '@/components/admin/MessagesInbox';

export const metadata: Metadata = { title: 'Messages' };

const PER_PAGE = 50;

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ filter?: string; page?: string; open?: string }> }) {
  const sp = await searchParams;
  const filter = sp.filter === 'unread' ? 'unread' : 'all';
  const page = Math.max(0, Number(sp.page || 0) || 0);
  const { supabase } = await getAdminSession();
  let q = supabase
    .from('messages')
    .select('id, name, email, phone, message, lang, page, is_read, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * PER_PAGE, page * PER_PAGE + PER_PAGE - 1);
  if (filter === 'unread') q = q.eq('is_read', false);
  const { data, count, error } = await q;
  return (
    <>
      <div className="page-head">
        <div className="titles">
          <h1>Messages</h1>
          <p>Messages sent from the contact forms on the website.</p>
        </div>
      </div>
      {error && <div className="notice notice-error">{error.message}</div>}
      <MessagesInbox
        key={`${filter}-${page}`}
        messages={(data || []) as Message[]}
        total={count ?? 0}
        page={page}
        perPage={PER_PAGE}
        filter={filter}
        openId={sp.open || null}
      />
    </>
  );
}
