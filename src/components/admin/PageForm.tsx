'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { PAGE_MAP } from '@/lib/content-types';
import type { Lang } from '@/lib/types';
import { savePage } from '@/lib/admin/actions';
import { formatDate, pagePublicPath, type Rec } from '@/lib/admin/util';
import { FormContext, FormField, guessDef, useFieldErrors } from './fields';
import { SeoFields } from './SeoFields';
import { Icon } from './Icon';
import { Spinner, useSaveShortcut, useUi, useUnsavedWarning } from './ui';

type Tab = 'content' | 'seo' | 'advanced';

export function PageForm({ pageKey, lang, data, seo, exists, updatedAt }: { pageKey: string; lang: Lang; data: Rec; seo: Rec; exists: boolean; updatedAt: string | null }) {
  const def = PAGE_MAP[pageKey];
  const router = useRouter();
  const { toast } = useUi();
  const [d, setD] = useState<Rec>(data);
  const [s, setS] = useState<Rec>(seo);
  const [baseline, setBaseline] = useState(() => JSON.stringify([data, seo]));
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>(def.fields.length ? 'content' : 'seo');
  const { errors, reportError } = useFieldErrors();
  const dirty = useMemo(() => JSON.stringify([d, s]) !== baseline, [d, s, baseline]);
  useUnsavedWarning(dirty && !saving);

  const known = new Set(def.fields.map((f) => f.name));
  const otherKeys = Object.keys(d).filter((k) => !known.has(k));
  const errorList = Object.values(errors);

  const save = useCallback(async () => {
    if (errorList.length) return toast(errorList[0], 'err');
    setSaving(true);
    const res = await savePage(pageKey, lang, d, s);
    setSaving(false);
    if (!res.ok) return toast(res.error, 'err');
    setBaseline(JSON.stringify([d, s]));
    toast('Saved — the website is updated');
    router.refresh();
  }, [errorList, pageKey, lang, d, s, toast, router]);
  useSaveShortcut(save);

  const ctx = useMemo(() => ({ lang, reportError }), [lang, reportError]);
  const view = pagePublicPath(pageKey, lang);

  return (
    <FormContext.Provider value={ctx}>
      <div className="page-head">
        <div className="titles">
          <div className="crumbs">
            <Link href="/admin/pages">Pages</Link> / {def.label}
          </div>
          <h1>{def.label}</h1>
          <p>{exists ? `Last saved ${formatDate(updatedAt)}` : 'This page has no content in this language yet — saving creates it.'}</p>
        </div>
        <div className="actions">
          <div className="seg">
            <Link href={`/admin/pages/${pageKey}?lang=ar`} className={lang === 'ar' ? 'on' : ''}>
              Arabic
            </Link>
            <Link href={`/admin/pages/${pageKey}?lang=en`} className={lang === 'en' ? 'on' : ''}>
              English
            </Link>
          </div>
          {dirty && <span className="badge badge-amber">Unsaved changes</span>}
          {view && (
            <a className="btn" href={view} target="_blank" rel="noreferrer">
              <Icon name="external" /> View on site
            </a>
          )}
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <Spinner /> : <Icon name="check" />} Save
          </button>
        </div>
      </div>

      <div className="tabs">
        {def.fields.length > 0 && (
          <button className={`tab ${tab === 'content' ? 'active' : ''}`} onClick={() => setTab('content')}>
            Content
          </button>
        )}
        <button className={`tab ${tab === 'seo' ? 'active' : ''}`} onClick={() => setTab('seo')}>
          SEO
        </button>
        {otherKeys.length > 0 && (
          <button className={`tab ${tab === 'advanced' ? 'active' : ''}`} onClick={() => setTab('advanced')}>
            Other values
          </button>
        )}
      </div>

      {def.fields.length > 0 && (
        <div className="card card-body stack" hidden={tab !== 'content'} style={{ maxWidth: 980 }}>
          {def.fields.map((f) => (
            <FormField key={f.name} def={f} value={d[f.name]} onChange={(v) => setD((x) => ({ ...x, [f.name]: v }))} />
          ))}
        </div>
      )}
      <div className="card card-body stack" hidden={tab !== 'seo'} style={{ maxWidth: 980 }}>
        <SeoFields value={s} onChange={setS} />
      </div>
      {otherKeys.length > 0 && (
        <div className="card card-body stack" hidden={tab !== 'advanced'} style={{ maxWidth: 980 }}>
          <div className="notice">Other values stored for this page that are used by the website&apos;s layout.</div>
          {otherKeys.map((k) => (
            <FormField key={k} def={guessDef(k, d[k])} value={d[k]} onChange={(v) => setD((x) => ({ ...x, [k]: v }))} />
          ))}
        </div>
      )}
      {errorList.length > 0 && (
        <div className="notice notice-error" style={{ marginTop: 12 }}>
          {errorList[0]}
        </div>
      )}
    </FormContext.Provider>
  );
}
