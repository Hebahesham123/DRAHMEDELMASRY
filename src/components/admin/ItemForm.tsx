'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ITEM_TYPE_MAP } from '@/lib/content-types';
import type { Item, Lang } from '@/lib/types';
import { deleteItem, saveItem } from '@/lib/admin/actions';
import { SITE_URL, SLUG_BAD_CHARS, autoSlug, formatDate, getPath, isPlainObject, itemPublicPath, setPath, slugify, type Rec } from '@/lib/admin/util';
import { Field, FormContext, FormField, JsonText, useFieldErrors } from './fields';
import { Icon } from './Icon';
import { Spinner, Switch, useUi, useUnsavedWarning } from './ui';
import { SeoFields } from './SeoFields';

type Tab = 'content' | 'seo' | 'advanced';

export function ItemForm({ type, item, defaultLang }: { type: string; item: Item | null; defaultLang: Lang }) {
  const def = ITEM_TYPE_MAP[type];
  const router = useRouter();
  const { toast, confirm } = useUi();
  const isNew = !item;

  const initial = useMemo<Rec>(
    () =>
      item
        ? { ...item, extra: isPlainObject(item.extra) ? item.extra : {}, seo: isPlainObject(item.seo) ? item.seo : {} }
        : {
            type,
            lang: defaultLang,
            slug: def.slugInUrl ? '' : autoSlug(defaultLang, type),
            title: '',
            excerpt: '',
            image: '',
            image_alt: '',
            detail_image: '',
            detail_image_alt: '',
            detail_image_title: '',
            body_html: '',
            link: '',
            extra: {},
            seo: {},
            sort_order: null,
            featured: false,
            published: true,
          },
    [item, type, defaultLang, def.slugInUrl],
  );

  const [rec, setRec] = useState<Rec>(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [tab, setTab] = useState<Tab>('content');
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const { errors, reportError } = useFieldErrors();
  const recRef = useRef(rec);
  recRef.current = rec;

  const dirty = useMemo(() => JSON.stringify(rec) !== baseline, [rec, baseline]);
  useUnsavedWarning(dirty && !saving);

  const lang = (rec.lang === 'en' ? 'en' : 'ar') as Lang;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const slug = String(rec.slug || '');
  const origSlug = item?.slug || '';

  const set = useCallback((name: string, v: unknown) => {
    setRec((r) => {
      let n = setPath(r, name, v);
      if (name.startsWith('extra.') && v === undefined) {
        const extra = { ...(n.extra as Rec) };
        delete extra[name.slice(6)];
        n = { ...n, extra };
      }
      return n;
    });
  }, []);

  // suggest a slug from the title for new items
  useEffect(() => {
    if (isNew && def.slugInUrl && !slugTouched) setRec((r) => ({ ...r, slug: slugify(String(r.title || '')) }));
  }, [rec.title, isNew, def.slugInUrl, slugTouched]);

  const mainFields = def.fields.filter((f) => f.name !== 'featured');
  const hasFeatured = def.fields.some((f) => f.name === 'featured');
  const knownExtra = new Set(def.fields.filter((f) => f.name.startsWith('extra.')).map((f) => f.name.slice(6)));
  const extra = (rec.extra || {}) as Rec;
  const otherExtra = Object.fromEntries(Object.entries(extra).filter(([k]) => !knownExtra.has(k)));

  const slugError = !slug.trim() ? 'The slug is required.' : def.slugInUrl && SLUG_BAD_CHARS.test(slug) ? 'The slug cannot contain / ? # % or \\' : null;
  const errorList = Object.values(errors);
  const canSave = !saving && !slugError && !errorList.length;

  async function save() {
    if (!canSave) {
      if (slugError) toast(slugError, 'err');
      else if (errorList.length) toast(errorList[0], 'err');
      return;
    }
    const r = recRef.current;
    setSaving(true);
    const res = await saveItem({
      id: item?.id ?? null,
      type,
      lang: String(r.lang),
      slug: String(r.slug).trim(),
      title: String(r.title ?? ''),
      excerpt: String(r.excerpt ?? ''),
      image: String(r.image ?? ''),
      image_alt: String(r.image_alt ?? ''),
      detail_image: String(r.detail_image ?? ''),
      detail_image_alt: String(r.detail_image_alt ?? ''),
      detail_image_title: String(r.detail_image_title ?? ''),
      body_html: String(r.body_html ?? ''),
      link: String(r.link ?? ''),
      extra: (r.extra as Rec) || {},
      seo: (r.seo as Rec) || {},
      sort_order: r.sort_order === null || r.sort_order === '' || r.sort_order === undefined ? null : Number(r.sort_order),
      featured: !!r.featured,
      published: !!r.published,
    });
    setSaving(false);
    if (!res.ok) {
      toast(res.error, 'err');
      return;
    }
    setBaseline(JSON.stringify(r));
    toast(isNew ? 'Created — it is now on the website' : 'Saved — the website is updated');
    if (isNew) router.replace(`/admin/items/${type}/${res.id}`);
    else router.refresh();
  }

  // Ctrl/Cmd + S
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function remove() {
    if (!item) return;
    const ok = await confirm({ title: 'Delete this item?', text: 'It will be removed from the website permanently. This cannot be undone.', confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    const res = await deleteItem(item.id);
    if (!res.ok) return toast(res.error, 'err');
    setBaseline(JSON.stringify(rec));
    toast('Deleted');
    router.replace(`/admin/items/${type}?lang=${lang}`);
  }

  const publicPath = itemPublicPath(type, isNew ? '' : origSlug);
  const newPublicUrl = def.detailPath ? `${SITE_URL}${def.detailPath}/${slug}` : '';

  const ctx = useMemo(
    () => ({
      lang,
      reportError,
      getBody: () => String(recRef.current.body_html || ''),
      setBody: (html: string) => set('body_html', html),
    }),
    [lang, reportError, set],
  );

  return (
    <FormContext.Provider value={ctx}>
      <div className="page-head">
        <div className="titles">
          <div className="crumbs">
            <Link href={`/admin/items/${type}?lang=${lang}`}>{def.label}</Link> / {isNew ? 'New' : 'Edit'}
          </div>
          <h1 dir="auto">{isNew ? `New: ${def.label}` : String(rec.title || item?.slug || 'Edit')}</h1>
        </div>
        <div className="actions">
          {dirty && <span className="badge badge-amber">Unsaved changes</span>}
          {publicPath && (
            <a className="btn" href={publicPath} target="_blank" rel="noreferrer">
              <Icon name="external" /> View on site
            </a>
          )}
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <Spinner /> : <Icon name="check" />} {isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </div>

      <div className="editor">
        <div style={{ minWidth: 0 }}>
          <div className="tabs">
            <button className={`tab ${tab === 'content' ? 'active' : ''}`} onClick={() => setTab('content')}>
              Content
            </button>
            {def.hasSeo && (
              <button className={`tab ${tab === 'seo' ? 'active' : ''}`} onClick={() => setTab('seo')}>
                SEO
              </button>
            )}
            <button className={`tab ${tab === 'advanced' ? 'active' : ''}`} onClick={() => setTab('advanced')}>
              Advanced
            </button>
          </div>

          {/* tabs stay mounted so editors keep their state */}
          <div className="card card-body stack" hidden={tab !== 'content'} dir="ltr">
            {mainFields.map((f) => (
              <FormField key={f.name} def={f} value={getPath(rec, f.name)} onChange={(v) => set(f.name, v)} />
            ))}
          </div>

          {def.hasSeo && (
            <div className="card card-body stack" hidden={tab !== 'seo'}>
              <SeoFields value={(rec.seo as Rec) || {}} onChange={(v) => set('seo', v)} />
            </div>
          )}

          <div className="card card-body stack" hidden={tab !== 'advanced'}>
            <div className="notice">These are extra stored values used by the website&apos;s layout. Change them only if you know what they do.</div>
            <Field label="Other extra data (JSON)" help="Keys inside “extra” that have no form field above (e.g. detail_image_style: plain | w-100 | before_after).">
              <JsonText
                name="__extra_other"
                value={otherExtra}
                onChange={(v) => {
                  const known = Object.fromEntries(Object.entries(extra).filter(([k]) => knownExtra.has(k)));
                  set('extra', { ...known, ...(isPlainObject(v) ? v : {}) });
                }}
              />
            </Field>
            {!def.slugInUrl && (
              <Field label="Internal id (slug)" help="Not shown on the website.">
                <input className="input mono" dir="ltr" value={slug} onChange={(e) => set('slug', e.target.value)} />
              </Field>
            )}
          </div>
        </div>

        <div className="editor-side">
          <div className="card card-body stack">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="label">Visible on the website</span>
              <Switch checked={!!rec.published} onChange={(v) => set('published', v)} label="Visible on the website" />
            </div>
            {hasFeatured && (
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="label">Show in the home page slider</span>
                <Switch checked={!!rec.featured} onChange={(v) => set('featured', v)} label="Featured" />
              </div>
            )}
            <Field label="Language">
              <select className="select" value={lang} onChange={(e) => set('lang', e.target.value)}>
                <option value="ar">Arabic (العربية)</option>
                <option value="en">English</option>
              </select>
            </Field>
            {def.slugInUrl && (
              <Field
                label="Slug (web address)"
                error={slugError}
                help={
                  <>
                    Address: <span dir="ltr" style={{ overflowWrap: 'anywhere' }}>{newPublicUrl}</span>
                  </>
                }
              >
                <input
                  className={`input ${slugError ? 'invalid' : ''}`}
                  dir={dir}
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set('slug', e.target.value);
                  }}
                />
                {isNew && !slugTouched && <span className="help">Suggested from the title — you can change it.</span>}
                {!isNew && slug !== origSlug && (
                  <span className="warn-text">
                    ⚠ Changing the slug changes the page address. Old links (Google, social media) to this page will stop working.
                  </span>
                )}
              </Field>
            )}
            <Field label="Order" help="Smaller numbers come first. You can also reorder from the list.">
              <input
                className="input"
                type="number"
                style={{ maxWidth: 140 }}
                value={rec.sort_order === null || rec.sort_order === undefined ? '' : String(rec.sort_order)}
                placeholder={isNew ? 'Last' : ''}
                onChange={(e) => set('sort_order', e.target.value === '' ? null : Number(e.target.value))}
              />
            </Field>
            <button className="btn btn-primary btn-block" onClick={save} disabled={saving}>
              {saving ? <Spinner /> : <Icon name="check" />} {isNew ? 'Create' : 'Save changes'}
            </button>
            {errorList.length > 0 && <div className="notice notice-error">{errorList[0]}</div>}
            <span className="help">Tip: press Ctrl+S to save.</span>
          </div>
          {item && (
            <div className="card card-body stack">
              <div className="small muted">
                Created {formatDate(item.created_at)}
                <br />
                Last saved {formatDate(item.updated_at)}
              </div>
              <button className="btn btn-danger btn-block" onClick={remove}>
                <Icon name="trash" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </FormContext.Provider>
  );
}

