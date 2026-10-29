'use client';
/* eslint-disable @next/next/no-img-element */

import dynamic from 'next/dynamic';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { FieldDef } from '@/lib/content-types';
import type { Lang } from '@/lib/types';
import { IMAGE_EXT, generateToc, isPlainObject, previewUrl, type Rec } from '@/lib/admin/util';
import { Icon } from './Icon';
import { MediaPicker } from './MediaPicker';
import { Spinner, Switch, useUi } from './ui';

const HtmlEditor = dynamic(() => import('./HtmlEditor'), {
  ssr: false,
  loading: () => (
    <div className="html-ed" style={{ padding: 20 }}>
      <span className="row-nowrap muted">
        <Spinner /> Loading editor…
      </span>
    </div>
  ),
});

/* ------------------------------------------------------------------ */
/* form context                                                        */
/* ------------------------------------------------------------------ */

interface FormCtx {
  lang: Lang;
  /** JSON fields report parse errors so the form can block saving */
  reportError: (name: string, msg: string | null) => void;
  /** for the table-of-contents helper */
  getBody?: () => string;
  setBody?: (html: string) => void;
}

export const FormContext = createContext<FormCtx>({ lang: 'ar', reportError: () => {} });
export const useForm = () => useContext(FormContext);

export function useFieldErrors() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const reportError = useRef((name: string, msg: string | null) =>
    setErrors((e) => {
      if (!msg) {
        if (!(name in e)) return e;
        const n = { ...e };
        delete n[name];
        return n;
      }
      return e[name] === msg ? e : { ...e, [name]: msg };
    }),
  ).current;
  return { errors, reportError };
}

const LTR_NAME =
  /(^|[._])(link|href|url|src|map|map_menu|map_footer|image_link|canonical|og_image|og_type|og_url|color|gtm_id|icon|width|overlay|iframe_src|youtube_id|hreflang_default|position|home_order)$|^(email|phone|number|hero_phone)$|\.(email|number|phone)$/i;

function dirFor(def: Pick<FieldDef, 'name' | 'kind'>, lang: Lang): 'rtl' | 'ltr' | 'auto' {
  if (def.kind === 'url' || def.kind === 'image' || def.kind === 'file' || def.kind === 'number' || def.kind === 'json') return 'ltr';
  if (LTR_NAME.test(def.name)) return 'ltr';
  return lang === 'ar' ? 'rtl' : 'ltr';
}

/* ------------------------------------------------------------------ */
/* wrapper                                                             */
/* ------------------------------------------------------------------ */

export function Field({ label, help, children, htmlFor, error }: { label?: ReactNode; help?: ReactNode; children: ReactNode; htmlFor?: string; error?: string | null }) {
  return (
    <div className="field">
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {error && <span className="error-text">{error}</span>}
      {help && <span className="help">{help}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* the dispatcher                                                      */
/* ------------------------------------------------------------------ */

export function FieldInput({ def, value, onChange }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const { lang } = useForm();
  const dir = dirFor(def, lang);
  const str = value == null ? '' : typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';

  switch (def.kind) {
    case 'html':
      return <HtmlEditor value={typeof value === 'string' ? value : ''} onChange={onChange} dir={lang === 'ar' ? 'rtl' : 'ltr'} />;
    case 'textarea': {
      if (value != null && typeof value !== 'string') return <JsonText name={def.name} value={value} onChange={onChange} />;
      return <AutoTextarea value={str} onChange={onChange} dir={dir} mono={/schema/.test(def.name)} />;
    }
    case 'image':
    case 'file':
      return <MediaField value={str} onChange={onChange} kind={def.kind} />;
    case 'number':
      return (
        <input
          className="input"
          type="number"
          style={{ maxWidth: 180 }}
          value={value == null || value === '' ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        />
      );
    case 'boolean':
      return (
        <label className="checkbox">
          <Switch checked={!!value} onChange={onChange} />
          <span>{value ? 'Yes' : 'No'}</span>
        </label>
      );
    case 'list':
      return <ListField name={def.name} label={def.label} value={value} onChange={onChange} />;
    case 'json':
      return <JsonField def={def} value={value} onChange={onChange} />;
    case 'url':
    case 'text':
    default:
      if (value != null && typeof value === 'object') return <JsonText name={def.name} value={value} onChange={onChange} />;
      return <input className="input" type="text" dir={dir} value={str} onChange={(e) => onChange(e.target.value)} />;
  }
}

/** A labelled field. */
export function FormField({ def, value, onChange }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  return (
    <Field label={def.label} help={def.help}>
      <FieldInput def={def} value={value} onChange={onChange} />
    </Field>
  );
}

/* ------------------------------------------------------------------ */
/* basic inputs                                                        */
/* ------------------------------------------------------------------ */

export function AutoTextarea({ value, onChange, dir, mono, minRows = 3 }: { value: string; onChange: (v: string) => void; dir?: string; mono?: boolean; minRows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(Math.max(el.scrollHeight + 2, minRows * 22 + 16), 600) + 'px';
  }, [value, minRows]);
  return (
    <textarea
      ref={ref}
      className={`textarea ${mono ? 'code' : ''}`}
      dir={mono ? 'ltr' : dir}
      value={value}
      spellCheck={!mono}
      onChange={(e) => onChange(e.target.value)}
      style={mono ? { whiteSpace: 'pre-wrap' } : undefined}
    />
  );
}

export function MediaField({ value, onChange, kind = 'image' }: { value: string; onChange: (v: string) => void; kind?: 'image' | 'file' }) {
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);
  const src = previewUrl(value);
  const isImage = kind === 'image' || IMAGE_EXT.test(value);
  useEffect(() => setBroken(false), [value]);
  return (
    <div className="img-field">
      {isImage ? (
        <div className="img-preview">{value && !broken ? <img src={src} alt="" onError={() => setBroken(true)} /> : <span>{value ? 'Preview not available' : 'No image'}</span>}</div>
      ) : null}
      <div className="controls">
        <input className="input mono" dir="ltr" value={value} placeholder={kind === 'image' ? '/ApplicationImages/… or https://…' : 'Path or URL of the file'} onChange={(e) => onChange(e.target.value)} />
        <div className="row">
          <button type="button" className="btn btn-sm" onClick={() => setOpen(true)}>
            <Icon name={kind === 'image' ? 'image' : 'file'} size={14} /> {value ? 'Change' : 'Choose / upload'}
          </button>
          {value && (
            <>
              <a className="btn btn-sm btn-ghost" href={src} target="_blank" rel="noreferrer">
                <Icon name="external" size={14} /> Open
              </a>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange('')}>
                <Icon name="x" size={14} /> Remove
              </button>
            </>
          )}
        </div>
      </div>
      {open && <MediaPicker accept={kind === 'image' ? 'image' : 'any'} onClose={() => setOpen(false)} onPick={onChange} />}
    </div>
  );
}

function move<T>(arr: T[], i: number, d: number): T[] {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const n = [...arr];
  [n[i], n[j]] = [n[j], n[i]];
  return n;
}

function RowButtons({ i, len, onMove, onRemove }: { i: number; len: number; onMove: (d: number) => void; onRemove: () => void }) {
  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm btn-icon" disabled={i === 0} onClick={() => onMove(-1)} title="Move up" aria-label="Move up">
        <Icon name="up" size={14} />
      </button>
      <button type="button" className="btn btn-ghost btn-sm btn-icon" disabled={i === len - 1} onClick={() => onMove(1)} title="Move down" aria-label="Move down">
        <Icon name="down" size={14} />
      </button>
      <button type="button" className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={onRemove} title="Remove" aria-label="Remove">
        <Icon name="trash" size={14} />
      </button>
    </>
  );
}

/** List of strings. Rows that hold image paths get a picker button. */
export function ListField({ name, label, value, onChange }: { name: string; label?: string; value: unknown; onChange: (v: string[]) => void }) {
  const { lang } = useForm();
  const list = Array.isArray(value) ? value.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))) : [];
  const imageList = /image|logo|photo/i.test(name + ' ' + (label || '')) || (list.length > 0 && list.every((v) => IMAGE_EXT.test(v)));
  const ltr = imageList || LTR_NAME.test(name) || /phone/i.test(name);
  const [pickFor, setPickFor] = useState<number | null>(null);
  const set = (i: number, v: string) => onChange(list.map((x, j) => (j === i ? v : x)));
  return (
    <div className="list-ed">
      {list.map((v, i) => (
        <div className="list-row" key={i}>
          {imageList && (v ? <img className="thumb" src={previewUrl(v)} alt="" /> : <div className="thumb-empty" />)}
          <input className={`input ${imageList ? 'mono' : ''}`} dir={ltr ? 'ltr' : lang === 'ar' ? 'rtl' : 'ltr'} value={v} onChange={(e) => set(i, e.target.value)} />
          {imageList && (
            <button type="button" className="btn btn-sm" onClick={() => setPickFor(i)}>
              <Icon name="image" size={14} /> Choose
            </button>
          )}
          <RowButtons i={i} len={list.length} onMove={(d) => onChange(move(list, i, d))} onRemove={() => onChange(list.filter((_, j) => j !== i))} />
        </div>
      ))}
      <div>
        <button type="button" className="btn btn-sm" onClick={() => onChange([...list, ''])}>
          <Icon name="plus" size={14} /> Add
        </button>
      </div>
      {pickFor !== null && <MediaPicker onClose={() => setPickFor(null)} onPick={(v) => set(pickFor, v)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* JSON                                                                */
/* ------------------------------------------------------------------ */

/** JSON textarea with validation (reports errors to the form). */
export function JsonText({ name, value, onChange, rows = 8 }: { name: string; value: unknown; onChange: (v: unknown) => void; rows?: number }) {
  const { reportError } = useForm();
  const fmt = (v: unknown) => (v === undefined ? '' : JSON.stringify(v, null, 2));
  const [text, setText] = useState(() => fmt(value));
  const [err, setErr] = useState<string | null>(null);
  const last = useRef(value);
  useEffect(() => {
    if (value !== last.current) {
      last.current = value;
      setText(fmt(value));
      setErr(null);
      reportError(name, null);
    }
  }, [value, name, reportError]);
  useEffect(() => () => reportError(name, null), [name, reportError]);
  return (
    <>
      <textarea
        className={`textarea code ${err ? 'invalid' : ''}`}
        dir="ltr"
        rows={rows}
        spellCheck={false}
        value={text}
        onChange={(e) => {
          const t = e.target.value;
          setText(t);
          if (!t.trim()) {
            setErr(null);
            reportError(name, null);
            last.current = undefined;
            onChange(undefined);
            return;
          }
          try {
            const v = JSON.parse(t);
            setErr(null);
            reportError(name, null);
            last.current = v;
            onChange(v);
          } catch (ex) {
            const m = `Invalid JSON: ${(ex as Error).message}`;
            setErr(m);
            reportError(name, m);
          }
        }}
      />
      {err && <span className="error-text">{err}</span>}
    </>
  );
}

function humanize(key: string) {
  return key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

export function guessDef(key: string, v: unknown): FieldDef {
  if (typeof v === 'boolean') return { name: key, label: humanize(key), kind: 'boolean' };
  if (typeof v === 'number') return { name: key, label: humanize(key), kind: 'number' };
  if (Array.isArray(v) && v.every((x) => typeof x === 'string')) return { name: key, label: humanize(key), kind: 'list' };
  if (typeof v === 'string') {
    if (/(^|_)(image|img|logo|photo)/i.test(key) && !/alt|title/i.test(key)) return { name: key, label: humanize(key), kind: 'image' };
    if (/(^|_)(pdf|file)$/i.test(key)) return { name: key, label: humanize(key), kind: 'file' };
    if (v.length > 80 || v.includes('\n')) return { name: key, label: humanize(key), kind: 'textarea' };
    return { name: key, label: humanize(key), kind: 'text' };
  }
  return { name: key, label: humanize(key), kind: 'json' };
}

/** Friendly editor for a plain object: one input per existing key (nested objects become sub-sections). */
export function ObjectEditor({ value, onChange, fields, path }: { value: Rec; onChange: (v: Rec) => void; fields?: FieldDef[]; path: string }) {
  const keys = fields ? fields.map((f) => f.name) : [];
  for (const k of Object.keys(value)) if (!keys.includes(k)) keys.push(k);
  return (
    <div className="fieldset">
      {keys.map((k) => {
        const def = fields?.find((f) => f.name === k) || guessDef(k, value[k]);
        const v = value[k];
        if (def.kind === 'json' && isPlainObject(v)) {
          return (
            <div key={k} className="field">
              <label>{def.label}</label>
              <ObjectEditor path={`${path}.${k}`} value={v} onChange={(nv) => onChange({ ...value, [k]: nv })} />
            </div>
          );
        }
        return <FormField key={k} def={{ ...def, name: `${path}.${k}` }} value={v} onChange={(nv) => onChange({ ...value, [k]: nv })} />;
      })}
      {!keys.length && <span className="muted small">Empty</span>}
    </div>
  );
}

/** Array of objects edited as cards. */
export function ArrayEditor({ value, onChange, itemFields, path }: { value: Rec[]; onChange: (v: Rec[]) => void; itemFields: FieldDef[]; path: string }) {
  const [openIdx, setOpenIdx] = useState<Set<number>>(() => new Set(value.length <= 3 && !itemFields.some((f) => f.kind === 'html') ? value.map((_, i) => i) : []));
  const titleOf = (o: Rec, i: number) => {
    const f = itemFields.find((d) => d.kind === 'text' || d.kind === 'url');
    const t = f ? o[f.name] : undefined;
    return typeof t === 'string' && t.trim() ? t : `Item ${i + 1}`;
  };
  const toggle = (i: number) =>
    setOpenIdx((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  return (
    <div className="list-ed">
      {value.map((o, i) => {
        const open = openIdx.has(i);
        return (
          <div className={`obj-item ${open ? '' : 'collapsed'}`} key={i}>
            <div className="obj-item-head">
              <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => toggle(i)} aria-label={open ? 'Collapse' : 'Expand'}>
                <Icon name={open ? 'down' : 'right'} size={14} />
              </button>
              <span className="t" dir="auto" onClick={() => toggle(i)} style={{ cursor: 'pointer' }}>
                {titleOf(o, i)}
              </span>
              <RowButtons
                i={i}
                len={value.length}
                onMove={(d) => {
                  onChange(move(value, i, d));
                  setOpenIdx(new Set());
                }}
                onRemove={() => {
                  onChange(value.filter((_, j) => j !== i));
                  setOpenIdx(new Set());
                }}
              />
            </div>
            {open && (
              <div className="obj-item-body">
                {itemFields.map((f) => (
                  <FormField key={f.name} def={{ ...f, name: f.name }} value={o[f.name]} onChange={(nv) => onChange(value.map((x, j) => (j === i ? { ...x, [f.name]: nv } : x)))} />
                ))}
                {Object.keys(o)
                  .filter((k) => !itemFields.some((f) => f.name === k))
                  .map((k) => (
                    <FormField key={k} def={{ ...guessDef(k, o[k]), name: `${path}.${i}.${k}` }} value={o[k]} onChange={(nv) => onChange(value.map((x, j) => (j === i ? { ...x, [k]: nv } : x)))} />
                  ))}
              </div>
            )}
          </div>
        );
      })}
      <div>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            onChange([...value, Object.fromEntries(itemFields.map((f) => [f.name, f.kind === 'list' ? [] : f.kind === 'boolean' ? false : '']))]);
            setOpenIdx((s) => new Set(s).add(value.length));
          }}
        >
          <Icon name="plus" size={14} /> Add
        </button>
      </div>
    </div>
  );
}

/* ---------- table of contents ---------- */

interface Toc {
  title: string;
  entries: { id: string; text: string }[];
}

function TocEditor({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const { lang, getBody, setBody } = useForm();
  const { confirm, toast } = useUi();
  const toc: Toc | null = isPlainObject(value) ? { title: String(value.title ?? ''), entries: Array.isArray(value.entries) ? (value.entries as Toc['entries']) : [] } : null;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const set = (t: Toc) => onChange({ ...(isPlainObject(value) ? value : {}), ...t });

  async function generate() {
    if (!getBody || !setBody) return;
    const body = getBody();
    const res = generateToc(body);
    if (!res.entries.length) {
      toast('No <h2> headings were found in the content. Use “Heading 2” for the section titles first.', 'err');
      return;
    }
    if (toc?.entries.length) {
      const ok = await confirm({
        title: 'Rebuild the table of contents?',
        text: `The current ${toc.entries.length} entries will be replaced by ${res.entries.length} entries built from the Heading 2 titles in the content. Each heading gets an anchor (<span id="N">).`,
        confirmLabel: 'Rebuild',
      });
      if (!ok) return;
    }
    if (res.html !== body) setBody(res.html);
    set({ title: toc?.title || (lang === 'ar' ? 'محتوى المقال' : 'Table of Contents'), entries: res.entries });
    toast(`Table of contents built: ${res.entries.length} headings`);
  }

  return (
    <div className="fieldset">
      <div className="row">
        {getBody && (
          <button type="button" className="btn btn-sm btn-primary" onClick={generate}>
            <Icon name="wand" size={14} /> Generate from headings
          </button>
        )}
        {toc && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange(undefined)}>
            <Icon name="x" size={14} /> Remove table of contents
          </button>
        )}
        {!toc && (
          <button type="button" className="btn btn-sm" onClick={() => set({ title: lang === 'ar' ? 'محتوى المقال' : 'Table of Contents', entries: [] })}>
            <Icon name="plus" size={14} /> Add manually
          </button>
        )}
      </div>
      {toc && (
        <>
          <Field label="Title">
            <input className="input" dir={dir} value={toc.title} onChange={(e) => set({ ...toc, title: e.target.value })} />
          </Field>
          <div className="field">
            <label>Entries (anchor id → text)</label>
            <div className="list-ed">
              {toc.entries.map((en, i) => (
                <div className="list-row" key={i}>
                  <input className="input mono" style={{ width: 70, flex: 'none' }} dir="ltr" value={en.id} onChange={(e) => set({ ...toc, entries: toc.entries.map((x, j) => (j === i ? { ...x, id: e.target.value } : x)) })} />
                  <input className="input" dir={dir} value={en.text} onChange={(e) => set({ ...toc, entries: toc.entries.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
                  <RowButtons i={i} len={toc.entries.length} onMove={(d) => set({ ...toc, entries: move(toc.entries, i, d) })} onRemove={() => set({ ...toc, entries: toc.entries.filter((_, j) => j !== i) })} />
                </div>
              ))}
              <div>
                <button type="button" className="btn btn-sm" onClick={() => set({ ...toc, entries: [...toc.entries, { id: String(toc.entries.length), text: '' }] })}>
                  <Icon name="plus" size={14} /> Add entry
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const CONTACT_BOX_FIELDS: FieldDef[] = [
  { name: 'title', label: 'Title', kind: 'text' },
  { name: 'text', label: 'Text', kind: 'textarea' },
  { name: 'button', label: 'Button text', kind: 'text' },
];

/** kind "json": friendly sub-forms when possible, with a JSON fallback. */
export function JsonField({ def, value, onChange }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const [raw, setRaw] = useState(false);
  const { reportError } = useForm();
  const isToc = def.name === 'extra.toc';
  const isContact = def.name === 'extra.contact_box';
  const objArray = Array.isArray(value) && value.every(isPlainObject);
  const friendly = isToc || isContact || (def.itemFields && (value == null || objArray)) || isPlainObject(value) || objArray;

  let body: ReactNode;
  if (raw || !friendly) {
    body = <JsonText name={def.name} value={value} onChange={onChange} />;
  } else if (isToc) {
    body = <TocEditor value={value} onChange={onChange} />;
  } else if (isContact) {
    body =
      value == null ? (
        <button type="button" className="btn btn-sm" onClick={() => onChange({ title: '', text: '', button: '' })}>
          <Icon name="plus" size={14} /> Add contact box
        </button>
      ) : (
        <ObjectEditor path={def.name} value={isPlainObject(value) ? value : {}} fields={CONTACT_BOX_FIELDS} onChange={onChange} />
      );
  } else if (def.itemFields || objArray) {
    const arr = (Array.isArray(value) ? value : []) as Rec[];
    const fields =
      def.itemFields ||
      Array.from(new Set(arr.flatMap((o) => Object.keys(o)))).map((k) => guessDef(k, arr.find((o) => o[k] !== undefined)?.[k]));
    body = <ArrayEditor path={def.name} value={arr} itemFields={fields} onChange={onChange} />;
  } else {
    body = <ObjectEditor path={def.name} value={value as Rec} onChange={onChange} />;
  }

  return (
    <div className="stack" style={{ gap: 6 }}>
      {body}
      {friendly && (
        <div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              if (raw) reportError(def.name, null);
              setRaw(!raw);
            }}
          >
            <Icon name="code" size={13} /> {raw ? 'Back to the form' : 'Edit as JSON'}
          </button>
        </div>
      )}
    </div>
  );
}
