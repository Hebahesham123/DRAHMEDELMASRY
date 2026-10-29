'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { deleteMessages, setMessageRead } from '@/lib/admin/actions';
import { formatDate } from '@/lib/admin/util';
import { Icon } from './Icon';
import { copyText, useUi } from './ui';

export interface Message {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  lang: string;
  page: string;
  is_read: boolean;
  created_at: string;
}

export function MessagesInbox({
  messages: initial,
  total,
  page,
  perPage,
  filter,
  openId,
}: {
  messages: Message[];
  total: number;
  page: number;
  perPage: number;
  filter: 'all' | 'unread';
  openId: string | null;
}) {
  const { toast, confirm } = useUi();
  const [list, setList] = useState(initial);
  const [open, setOpen] = useState<string | null>(openId);
  useEffect(() => setList(initial), [initial]);

  async function markRead(m: Message, read: boolean, silent = false) {
    if (m.is_read === read) return;
    setList((l) => l.map((x) => (x.id === m.id ? { ...x, is_read: read } : x)));
    const res = await setMessageRead([m.id], read);
    if (!res.ok) {
      setList((l) => l.map((x) => (x.id === m.id ? { ...x, is_read: !read } : x)));
      toast(res.error, 'err');
    } else if (!silent) toast(read ? 'Marked as read' : 'Marked as unread');
  }

  // opening a message marks it as read
  useEffect(() => {
    const m = list.find((x) => x.id === open);
    if (m && !m.is_read) markRead(m, true, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function remove(m: Message) {
    const ok = await confirm({ title: 'Delete this message?', text: `The message from ${m.name} will be deleted permanently.`, confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    const prev = list;
    setList((l) => l.filter((x) => x.id !== m.id));
    if (open === m.id) setOpen(null);
    const res = await deleteMessages([m.id]);
    if (!res.ok) {
      setList(prev);
      toast(res.error, 'err');
    } else toast('Message deleted');
  }

  async function markAllRead() {
    const ids = list.filter((m) => !m.is_read).map((m) => m.id);
    if (!ids.length) return;
    setList((l) => l.map((m) => ({ ...m, is_read: true })));
    const res = await setMessageRead(ids, true);
    if (!res.ok) toast(res.error, 'err');
    else toast(`${ids.length} marked as read`);
  }

  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = list.find((m) => m.id === open);

  return (
    <div className={`grid inbox ${current ? 'split' : ''}`}>
      <div className="card" style={{ minWidth: 0 }}>
        <div className="card-head">
          <div className="seg">
            <Link href="/admin/messages" className={filter === 'all' ? 'on' : ''}>
              All
            </Link>
            <Link href="/admin/messages?filter=unread" className={filter === 'unread' ? 'on' : ''}>
              Unread
            </Link>
          </div>
          <div className="spacer" />
          <button className="btn btn-sm" onClick={markAllRead} disabled={!list.some((m) => !m.is_read)}>
            <Icon name="check" size={14} /> Mark all as read
          </button>
        </div>
        {list.length === 0 ? (
          <div className="empty">{filter === 'unread' ? 'No unread messages.' : 'No messages yet.'}</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 20 }}></th>
                  <th>From</th>
                  <th>Message</th>
                  <th style={{ width: 150 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {list.map((m) => (
                  <tr key={m.id} className={m.is_read ? '' : 'unread'} style={{ cursor: 'pointer', background: open === m.id ? 'var(--accent-soft)' : undefined }} onClick={() => setOpen(m.id)}>
                    <td>{!m.is_read && <span className="dot" />}</td>
                    <td dir="auto">
                      {m.name}
                      <div className="small muted" style={{ fontWeight: 400 }}>
                        {m.phone || m.email}
                      </div>
                    </td>
                    <td dir="auto" style={{ maxWidth: 360 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 400 }}>{m.message}</div>
                    </td>
                    <td className="small muted" style={{ fontWeight: 400 }}>
                      {formatDate(m.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="card-head" style={{ borderTop: '1px solid var(--line)', borderBottom: 0 }}>
            <span className="small muted">
              Page {page + 1} of {pages} · {total} messages
            </span>
            <div className="spacer" />
            {page > 0 && (
              <Link className="btn btn-sm" href={`/admin/messages?filter=${filter}&page=${page - 1}`}>
                <Icon name="left" size={14} /> Newer
              </Link>
            )}
            {page < pages - 1 && (
              <Link className="btn btn-sm" href={`/admin/messages?filter=${filter}&page=${page + 1}`}>
                Older <Icon name="right" size={14} />
              </Link>
            )}
          </div>
        )}
      </div>
      {current && (
        <div className="card" style={{ minWidth: 0, alignSelf: 'start', position: 'sticky', top: 72 }}>
          <div className="card-head">
            <h2 dir="auto" className="grow">
              {current.name}
            </h2>
            <button className="btn btn-ghost btn-icon" onClick={() => setOpen(null)} aria-label="Close">
              <Icon name="x" />
            </button>
          </div>
          <div className="card-body stack">
            <dl className="kv">
              <dt>E-mail</dt>
              <dd>{current.email ? <a href={`mailto:${current.email}`}>{current.email}</a> : '—'}</dd>
              <dt>Phone</dt>
              <dd dir="ltr" style={{ textAlign: 'left' }}>
                {current.phone ? <a href={`tel:${current.phone}`}>{current.phone}</a> : '—'}
              </dd>
              <dt>Date</dt>
              <dd>{formatDate(current.created_at)}</dd>
              <dt>Language</dt>
              <dd>{current.lang === 'en' ? 'English' : 'Arabic'}</dd>
              <dt>Sent from</dt>
              <dd dir="auto">{current.page || '—'}</dd>
            </dl>
            <div className="msg-body" dir="auto">
              {current.message || <span className="muted">(empty)</span>}
            </div>
            <div className="row">
              {current.phone && (
                <a className="btn" href={`https://wa.me/${current.phone.replace(/[^\d]/g, '').replace(/^0/, '20')}`} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              )}
              <button className="btn" onClick={async () => (await copyText(`${current.name}\n${current.phone}\n${current.email}\n\n${current.message}`)) && toast('Copied')}>
                <Icon name="copy" size={14} /> Copy
              </button>
              <button className="btn" onClick={() => markRead(current, !current.is_read)}>
                <Icon name="envelopeOpen" size={14} /> Mark as {current.is_read ? 'unread' : 'read'}
              </button>
              <button className="btn btn-danger" onClick={() => remove(current)}>
                <Icon name="trash" size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
