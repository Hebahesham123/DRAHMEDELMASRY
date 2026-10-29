'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { browserClient } from '@/lib/supabase/browser';
import { fromStorageKey } from '@/lib/storage-key';
import { BUCKET, IMAGE_EXT, contentValueForKey, publicStorageUrl, uploadKey } from '@/lib/admin/util';
import { mediaChanged } from '@/lib/admin/actions';
import { Icon } from './Icon';
import { Spinner, copyText, useUi } from './ui';

interface Entry {
  name: string; // storage name (ASCII-safe)
  key: string; // full key
  isFolder: boolean;
  size?: number;
  type?: string;
  created?: string | null;
}

const LIMIT = 1000;
const LAST_PATH = 'adm-media-path';

function readLastPath() {
  try {
    return localStorage.getItem(LAST_PATH) || '';
  } catch {
    return '';
  }
}

function fmtSize(n?: number) {
  if (!n && n !== 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Upload files to the media bucket (uploads/yyyy/mm/…). Returns the uploaded keys. */
export async function uploadFiles(files: File[], onError: (msg: string) => void): Promise<string[]> {
  const sb = browserClient();
  const keys: string[] = [];
  for (const f of files) {
    const key = uploadKey(f.name);
    const { error } = await sb.storage.from(BUCKET).upload(key, f, { contentType: f.type || undefined, upsert: false, cacheControl: '31536000' });
    if (error) onError(`${f.name}: ${error.message}`);
    else keys.push(key);
  }
  return keys;
}

export function MediaLibrary({
  mode = 'page',
  accept = 'any',
  onPick,
}: {
  mode?: 'page' | 'picker';
  accept?: 'image' | 'any';
  onPick?: (value: string) => void;
}) {
  const { toast, confirm } = useUi();
  const [path, setPath] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [filter, setFilter] = useState('');
  const [uploading, setUploading] = useState(0);
  const [over, setOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const pendingSelect = useRef<Entry | null>(null);
  const sb = useMemo(() => browserClient(), []);

  useEffect(() => setPath(readLastPath()), []);

  const load = useCallback(
    async (p: string, offset = 0) => {
      setLoading(true);
      const { data, error } = await sb.storage.from(BUCKET).list(p, { limit: LIMIT, offset, sortBy: { column: 'name', order: 'asc' } });
      setLoading(false);
      if (error) {
        toast(`Could not load the folder: ${error.message}`, 'err');
        return;
      }
      const list: Entry[] = (data || [])
        .filter((o) => o.name && o.name !== '.emptyFolderPlaceholder')
        .map((o) => {
          const meta = (o.metadata || {}) as { size?: number; mimetype?: string };
          return {
            name: o.name,
            key: p ? `${p}/${o.name}` : o.name,
            isFolder: o.id === null,
            size: meta.size,
            type: meta.mimetype,
            created: o.created_at,
          };
        });
      setMore((data || []).length >= LIMIT);
      setEntries((prev) => (offset ? [...prev, ...list] : list));
    },
    [sb, toast],
  );

  useEffect(() => {
    if (path === null) return;
    setSelected(pendingSelect.current);
    pendingSelect.current = null;
    load(path);
    try {
      localStorage.setItem(LAST_PATH, path);
    } catch {}
  }, [path, load]);

  const shown = useMemo(() => {
    const f = filter.trim().toLowerCase();
    const list = entries.filter((e) => !f || fromStorageKey(e.name).toLowerCase().includes(f) || e.name.toLowerCase().includes(f));
    // folders first; newest uploads first inside uploads/
    const folders = list.filter((e) => e.isFolder);
    const files = list.filter((e) => !e.isFolder);
    if ((path || '').startsWith('uploads')) files.sort((a, b) => (b.name > a.name ? 1 : -1));
    return [...folders, ...files];
  }, [entries, filter, path]);

  async function handleUpload(files: File[]) {
    if (!files.length) return;
    const tooBig = files.filter((f) => f.size > 50 * 1024 * 1024);
    if (tooBig.length) toast(`Too big (max 50 MB): ${tooBig.map((f) => f.name).join(', ')}`, 'err');
    const ok = files.filter((f) => f.size <= 50 * 1024 * 1024);
    if (!ok.length) return;
    setUploading(ok.length);
    const keys = await uploadFiles(ok, (m) => toast(m, 'err'));
    setUploading(0);
    if (!keys.length) return;
    toast(keys.length === 1 ? 'File uploaded' : `${keys.length} files uploaded`);
    const folder = keys[0].split('/').slice(0, -1).join('/');
    const last = keys[keys.length - 1];
    const entry: Entry = { name: last.split('/').pop()!, key: last, isFolder: false, type: ok[ok.length - 1].type, size: ok[ok.length - 1].size };
    if (folder === path) {
      setSelected(entry);
      await load(folder);
    } else {
      pendingSelect.current = entry; // applied once the folder opens
      setPath(folder);
    }
  }

  async function remove(e: Entry) {
    const ok = await confirm({
      title: 'Delete this file?',
      text: (
        <>
          <b dir="auto">{fromStorageKey(e.name)}</b> will be deleted. Pages that still use it will show a broken image.
        </>
      ),
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    const { error } = await sb.storage.from(BUCKET).remove([e.key]);
    if (error) return toast(`Could not delete: ${error.message}`, 'err');
    setEntries((list) => list.filter((x) => x.key !== e.key));
    setSelected(null);
    toast('File deleted');
    mediaChanged();
  }

  const crumbs = (path || '').split('/').filter(Boolean);
  const isImg = (e: Entry) => IMAGE_EXT.test(e.name) || (e.type || '').startsWith('image/');
  const sitePath = (e: Entry) => contentValueForKey(e.key, fromStorageKey);
  const pick = (e: Entry) => {
    if (accept === 'image' && !isImg(e)) {
      toast('Please choose an image file.', 'err');
      return;
    }
    onPick?.(sitePath(e));
  };

  return (
    <div
      onDragOver={(ev) => {
        if (ev.dataTransfer.types.includes('Files')) {
          ev.preventDefault();
          setOver(true);
        }
      }}
      onDragLeave={(ev) => {
        if (ev.currentTarget === ev.target) setOver(false);
      }}
      onDrop={(ev) => {
        if (!ev.dataTransfer.files.length) return;
        ev.preventDefault();
        setOver(false);
        handleUpload(Array.from(ev.dataTransfer.files));
      }}
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}
    >
      <div className="media-toolbar">
        <div className="media-path grow">
          <button onClick={() => setPath('')}>
            <Icon name="folder" size={14} /> media
          </button>
          {crumbs.map((c, i) => (
            <span key={i} className="row-nowrap" style={{ gap: 4 }}>
              <span className="muted">/</span>
              <button onClick={() => setPath(crumbs.slice(0, i + 1).join('/'))} dir="auto">
                {fromStorageKey(c)}
              </button>
            </span>
          ))}
        </div>
        <input className="input search" placeholder="Filter by name…" value={filter} onChange={(e) => setFilter(e.target.value)} dir="auto" style={{ maxWidth: 220 }} />
        <button className="btn btn-sm" onClick={() => path !== null && load(path)} title="Refresh">
          <Icon name="refresh" size={14} />
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => fileInput.current?.click()} disabled={!!uploading}>
          {uploading ? <Spinner /> : <Icon name="upload" size={14} />} {uploading ? `Uploading ${uploading}…` : 'Upload'}
        </button>
        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          accept={accept === 'image' ? 'image/*' : undefined}
          onChange={(e) => {
            handleUpload(Array.from(e.target.files || []));
            e.target.value = '';
          }}
        />
      </div>
      <div className={`drop-zone ${over ? 'over' : ''}`}>
        <Icon name="upload" /> Drag &amp; drop files here to upload them{mode === 'picker' ? ', or pick an existing file below' : ''}. New files go to <code>uploads/</code>.
      </div>

      {selected && !selected.isFolder && (
        <div className="media-detail" style={{ marginTop: 14 }}>
          {isImg(selected) ? (
            <img className="big" src={publicStorageUrl(selected.key)} alt="" />
          ) : (
            <div className="big" style={{ display: 'grid', placeItems: 'center' }}>
              <Icon name="file" size={40} />
            </div>
          )}
          <div className="info">
            <b dir="auto" style={{ overflowWrap: 'anywhere' }}>
              {fromStorageKey(selected.name)}
            </b>
            <span className="small muted">
              {fmtSize(selected.size)} {selected.type}
            </span>
            <label className="small muted">Value to use in content</label>
            <div className="input-group">
              <input className="input mono" readOnly value={sitePath(selected)} dir="ltr" onFocus={(e) => e.target.select()} />
              <button className="btn btn-sm" onClick={async () => (await copyText(sitePath(selected))) && toast('Copied')}>
                <Icon name="copy" size={14} /> Copy
              </button>
            </div>
            {selected.key.startsWith('ApplicationImages/') && (
              <div className="input-group">
                <input className="input mono" readOnly value={publicStorageUrl(selected.key)} dir="ltr" onFocus={(e) => e.target.select()} />
                <button className="btn btn-sm" onClick={async () => (await copyText(publicStorageUrl(selected.key))) && toast('Copied')}>
                  <Icon name="copy" size={14} /> Storage URL
                </button>
              </div>
            )}
            <div className="row">
              {mode === 'picker' && (
                <button className="btn btn-primary" onClick={() => pick(selected)}>
                  <Icon name="check" /> Use this file
                </button>
              )}
              <a className="btn" href={publicStorageUrl(selected.key)} target="_blank" rel="noreferrer">
                <Icon name="external" /> Open
              </a>
              <button className="btn btn-danger" onClick={() => remove(selected)}>
                <Icon name="trash" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && !entries.length ? (
        <div className="loading-page" style={{ padding: 30 }}>
          <Spinner /> Loading files…
        </div>
      ) : shown.length === 0 ? (
        <div className="empty">{filter ? 'No files match the filter.' : 'This folder is empty.'}</div>
      ) : (
        <div className="media-grid">
          {path && (
            <button className="media-tile folder" onClick={() => setPath(crumbs.slice(0, -1).join('/'))}>
              <div className="pic">
                <Icon name="up" size={36} />
              </div>
              <div className="name">.. (back)</div>
            </button>
          )}
          {shown.map((e) =>
            e.isFolder ? (
              <button key={e.key} className="media-tile folder" onClick={() => setPath(e.key)}>
                <div className="pic">
                  <Icon name="folder" size={40} />
                </div>
                <div className="name" dir="auto">
                  {fromStorageKey(e.name)}
                </div>
              </button>
            ) : (
              <button
                key={e.key}
                className={`media-tile ${selected?.key === e.key ? 'selected' : ''}`}
                onClick={() => setSelected(e)}
                onDoubleClick={() => mode === 'picker' && pick(e)}
                title={fromStorageKey(e.name)}
              >
                <div className="pic">{isImg(e) ? <img src={publicStorageUrl(e.key)} alt="" loading="lazy" /> : <Icon name="file" size={36} />}</div>
                <div className="name" dir="auto">
                  {fromStorageKey(e.name)}
                </div>
              </button>
            ),
          )}
        </div>
      )}
      {more && (
        <div style={{ padding: '0 14px 14px' }}>
          <button className="btn" onClick={() => path !== null && load(path, entries.length)}>
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
