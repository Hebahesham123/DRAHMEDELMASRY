'use client';
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import type { Lang } from '@/lib/types';
import { deleteItem, reorderItems, setItemFlag } from '@/lib/admin/actions';
import { itemPublicPath, previewUrl, formatDate } from '@/lib/admin/util';
import { Icon } from './Icon';
import { Switch, useUi } from './ui';

export interface ItemRow {
  id: string;
  slug: string;
  title: string;
  image: string;
  published: boolean;
  featured: boolean;
  sort_order: number;
  updated_at: string;
}

const PAGE_SIZE = 25;

export function ItemsTable({
  type,
  lang,
  counts,
  rows: initial,
  initialQuery,
  hasFeatured,
  hasImage,
  showUrl,
}: {
  type: string;
  lang: Lang;
  counts: { ar: number; en: number };
  rows: ItemRow[];
  initialQuery: string;
  hasFeatured: boolean;
  hasImage: boolean;
  showUrl: boolean;
}) {
  const { toast, confirm } = useUi();
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState(initialQuery);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // server data refreshed (after an action) → take it
  useEffect(() => setRows(initial), [initial]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.title.toLowerCase().includes(s) || r.slug.toLowerCase().includes(s));
  }, [rows, q]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const cur = Math.min(page, pages - 1);
  const visible = filtered.slice(cur * PAGE_SIZE, cur * PAGE_SIZE + PAGE_SIZE);
  const searching = !!q.trim();

  async function toggle(row: ItemRow, field: 'published' | 'featured', value: boolean) {
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, [field]: value } : r)));
    setBusy((b) => ({ ...b, [row.id + field]: true }));
    const res = await setItemFlag(row.id, field, value);
    setBusy((b) => ({ ...b, [row.id + field]: false }));
    if (!res.ok) {
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, [field]: !value } : r)));
      toast(res.error, 'err');
    } else toast(field === 'published' ? (value ? 'Now visible on the website' : 'Hidden from the website') : value ? 'Featured' : 'No longer featured');
  }

  function saveOrder(next: ItemRow[]) {
    const prev = rows;
    setRows(next.map((r, i) => ({ ...r, sort_order: i })));
    startTransition(async () => {
      const res = await reorderItems(
        type,
        lang,
        next.map((r) => r.id),
      );
      if (!res.ok) {
        setRows(prev);
        toast(res.error, 'err');
      } else toast('Order saved');
    });
  }

  function move(id: string, delta: number) {
    const i = rows.findIndex((r) => r.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= rows.length) return;
    const next = [...rows];
    const [it] = next.splice(i, 1);
    next.splice(j, 0, it);
    saveOrder(next);
    // keep the moved row visible when it crosses a page boundary
    const newPage = Math.floor(j / PAGE_SIZE);
    if (newPage !== cur) setPage(newPage);
  }

  function drop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const next = [...rows];
    const from = next.findIndex((r) => r.id === dragId);
    const [it] = next.splice(from, 1);
    const to = next.findIndex((r) => r.id === targetId);
    next.splice(from <= to ? to + 1 : to, 0, it);
    saveOrder(next);
  }

  async function remove(row: ItemRow) {
    const ok = await confirm({
      title: 'Delete this item?',
      text: (
        <>
          <b dir="auto">{row.title || row.slug}</b> will be removed from the website permanently. This cannot be undone.
          <div className="help" style={{ marginTop: 8 }}>
            Tip: to remove it from the website only temporarily, switch off &quot;Visible&quot; instead.
          </div>
        </>
      ),
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    const prev = rows;
    setRows((rs) => rs.filter((r) => r.id !== row.id));
    const res = await deleteItem(row.id);
    if (!res.ok) {
      setRows(prev);
      toast(res.error, 'err');
    } else toast('Deleted');
  }

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="card">
      <div className="card-head" style={{ flexWrap: 'wrap' }}>
        <div className="seg">
          <Link href={`/admin/items/${type}?lang=ar`} className={lang === 'ar' ? 'on' : ''}>
            Arabic <span className="badge">{counts.ar}</span>
          </Link>
          <Link href={`/admin/items/${type}?lang=en`} className={lang === 'en' ? 'on' : ''}>
            English <span className="badge">{counts.en}</span>
          </Link>
        </div>
        <div className="spacer" />
        <div className="input-group search">
          <input
            className="input"
            placeholder="Search by title or slug…"
            value={q}
            dir="auto"
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
          />
        </div>
      </div>
      {searching && (
        <div className="notice" style={{ margin: '12px 18px 0' }}>
          Showing {filtered.length} of {rows.length}. Clear the search to change the order.
        </div>
      )}
      {visible.length === 0 ? (
        <div className="empty">{rows.length ? 'Nothing matches your search.' : 'No items yet. Click “Add new” to create the first one.'}</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>Order</th>
                {hasImage && <th style={{ width: 70 }}></th>}
                <th>Title</th>
                <th style={{ width: 80 }}>Visible</th>
                {hasFeatured && <th style={{ width: 80 }}>Home</th>}
                <th style={{ width: 130 }}>Updated</th>
                <th style={{ width: 120, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const idx = rows.indexOf(r);
                const href = itemPublicPath(type, r.slug);
                return (
                  <tr
                    key={r.id}
                    className={`${dragId === r.id ? 'dragging' : ''} ${overId === r.id && dragId !== r.id ? 'drop-target' : ''}`}
                    draggable={!searching}
                    onDragStart={(e) => {
                      setDragId(r.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverId(null);
                    }}
                    onDragOver={(e) => {
                      if (!dragId) return;
                      e.preventDefault();
                      setOverId(r.id);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      drop(r.id);
                      setDragId(null);
                      setOverId(null);
                    }}
                  >
                    <td>
                      <div className="row-nowrap" style={{ gap: 2 }}>
                        {!searching && (
                          <span className="drag-handle" title="Drag to reorder">
                            <Icon name="grip" />
                          </span>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <button className="btn btn-ghost btn-sm btn-icon" disabled={searching || idx === 0} onClick={() => move(r.id, -1)} title="Move up" aria-label="Move up">
                            <Icon name="up" size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm btn-icon"
                            disabled={searching || idx === rows.length - 1}
                            onClick={() => move(r.id, 1)}
                            title="Move down"
                            aria-label="Move down"
                          >
                            <Icon name="down" size={14} />
                          </button>
                        </div>
                      </div>
                    </td>
                    {hasImage && (
                      <td>{r.image ? <img className="thumb" src={previewUrl(r.image)} alt="" loading="lazy" /> : <div className="thumb-empty" />}</td>
                    )}
                    <td className="title-cell">
                      <Link href={`/admin/items/${type}/${r.id}`} dir={dir} style={{ display: 'inline-block' }}>
                        {r.title || <span className="muted">(no title)</span>}
                      </Link>
                      {showUrl && (
                        <div className="slug">
                          <span dir={dir}>/{r.slug}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <Switch checked={r.published} disabled={busy[r.id + 'published']} onChange={(v) => toggle(r, 'published', v)} label="Visible on the website" />
                    </td>
                    {hasFeatured && (
                      <td>
                        <Switch checked={r.featured} disabled={busy[r.id + 'featured']} onChange={(v) => toggle(r, 'featured', v)} label="Show in the home page slider" />
                      </td>
                    )}
                    <td className="small muted">{formatDate(r.updated_at)}</td>
                    <td>
                      <div className="row-nowrap" style={{ justifyContent: 'flex-end', gap: 2 }}>
                        <Link className="btn btn-ghost btn-icon" href={`/admin/items/${type}/${r.id}`} title="Edit" aria-label="Edit">
                          <Icon name="edit" />
                        </Link>
                        {href && (
                          <a className="btn btn-ghost btn-icon" href={href} target="_blank" rel="noreferrer" title="View on site" aria-label="View on site">
                            <Icon name="external" />
                          </a>
                        )}
                        <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }} onClick={() => remove(r)} title="Delete" aria-label="Delete">
                          <Icon name="trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="card-head" style={{ borderTop: '1px solid var(--line)', borderBottom: 0 }}>
          <span className="small muted">
            {cur * PAGE_SIZE + 1}–{Math.min(filtered.length, (cur + 1) * PAGE_SIZE)} of {filtered.length}
          </span>
          <div className="spacer" />
          <button className="btn btn-sm" disabled={cur === 0} onClick={() => setPage(cur - 1)}>
            <Icon name="left" size={14} /> Previous
          </button>
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} className={`btn btn-sm ${i === cur ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPage(i)}>
              {i + 1}
            </button>
          ))}
          <button className="btn btn-sm" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>
            Next <Icon name="right" size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
