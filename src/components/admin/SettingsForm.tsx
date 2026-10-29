'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import type { FieldDef } from '@/lib/content-types';
import type { Lang } from '@/lib/types';
import { saveSettings } from '@/lib/admin/actions';
import { formatDate, isPlainObject, type Rec } from '@/lib/admin/util';
import { ArrayEditor, AutoTextarea, Field, FormContext, FormField, JsonText, ListField, MediaField, guessDef, useFieldErrors, useForm } from './fields';
import { Icon } from './Icon';
import { Spinner, useSaveShortcut, useUi, useUnsavedWarning } from './ui';

const SOCIAL_FIELDS: FieldDef[] = [
  { name: 'url', label: 'Link', kind: 'url' },
  { name: 'icon', label: 'Icon (Font Awesome class, e.g. fab fa-facebook-f)', kind: 'text' },
  { name: 'label', label: 'Label', kind: 'text' },
];
const ADDRESS_FIELDS: FieldDef[] = [
  { name: 'name', label: 'Branch name', kind: 'text' },
  { name: 'text', label: 'Address', kind: 'textarea' },
  { name: 'map_menu', label: 'Google maps link (menu)', kind: 'url' },
  { name: 'map_footer', label: 'Google maps link (footer)', kind: 'url' },
  { name: 'footer_sep', label: 'Separator after the name in the footer', kind: 'text' },
];

const SECTIONS = [
  ['branding', 'Logo'],
  ['contact', 'Phones & e-mail'],
  ['addresses', 'Addresses'],
  ['whatsapp', 'WhatsApp'],
  ['menu', 'Main menu'],
  ['footer', 'Footer'],
  ['socials', 'Social links'],
  ['titles', 'Section titles'],
  ['tracking', 'Tracking & structured data'],
  ['labels', 'Labels'],
  ['other', 'Other'],
] as const;

const HANDLED = new Set([
  'logo_text', 'logo_light', 'logo_dark', 'footer_logo_text', 'phones', 'email', 'addresses', 'whatsapp', 'menu', 'footer_nav', 'footer_bottom_html',
  'menu_socials', 'footer_socials', 'side_socials', 'hero_socials', 'menu_title', 'address_title', 'contact_title', 'follow_title', 'side_title',
  'footer_nav_title', 'footer_contact_title', 'footer_address_title', 'toggle', 'lang_switch', 'gtm_id', 'schema_global', 'labels',
]);

interface Nav {
  label: string;
  href: string;
  children?: Nav[];
  [k: string]: unknown;
}

function NavEditor({ value, onChange, depth = 0 }: { value: Nav[]; onChange: (v: Nav[]) => void; depth?: number }) {
  const { lang } = useForm();
  const upd = (i: number, patch: Partial<Nav>) => onChange(value.map((n, j) => (j === i ? { ...n, ...patch } : n)));
  const mv = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const n = [...value];
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };
  return (
    <div className={depth ? 'menu-children' : 'list-ed'}>
      {value.map((n, i) => (
        <div key={i} className="stack" style={{ gap: 8 }}>
          <div className="list-row">
            <input className="input" placeholder="Label" dir={lang === 'ar' ? 'rtl' : 'ltr'} value={n.label || ''} onChange={(e) => upd(i, { label: e.target.value })} />
            <input className="input mono" placeholder={n.children?.length ? '(no link – opens the sub-menu)' : '/page-address'} dir="ltr" value={n.href || ''} onChange={(e) => upd(i, { href: e.target.value })} />
            <button type="button" className="btn btn-ghost btn-sm btn-icon" disabled={i === 0} onClick={() => mv(i, -1)} aria-label="Move up">
              <Icon name="up" size={14} />
            </button>
            <button type="button" className="btn btn-ghost btn-sm btn-icon" disabled={i === value.length - 1} onClick={() => mv(i, 1)} aria-label="Move down">
              <Icon name="down" size={14} />
            </button>
            {depth === 0 && (
              <button type="button" className="btn btn-ghost btn-sm" title="Add a sub-menu link" onClick={() => upd(i, { children: [...(n.children || []), { label: '', href: '' }] })}>
                <Icon name="plus" size={13} /> Sub
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove">
              <Icon name="trash" size={14} />
            </button>
          </div>
          {!!n.children?.length && (
            <NavEditor
              depth={depth + 1}
              value={n.children}
              onChange={(c) => {
                if (c.length) upd(i, { children: c });
                else {
                  const rest = { ...n };
                  delete rest.children;
                  onChange(value.map((x, j) => (j === i ? rest : x)));
                }
              }}
            />
          )}
        </div>
      ))}
      <div>
        <button type="button" className="btn btn-sm" onClick={() => onChange([...value, { label: '', href: '' }])}>
          <Icon name="plus" size={14} /> {depth ? 'Add sub-link' : 'Add link'}
        </button>
      </div>
    </div>
  );
}

function KeyValueEditor({ value, onChange, dir }: { value: Record<string, string>; onChange: (v: Record<string, string>) => void; dir: string }) {
  const entries = Object.entries(value);
  const rename = (oldK: string, newK: string) => onChange(Object.fromEntries(entries.map(([k, v]) => [k === oldK ? newK : k, v])));
  return (
    <div className="list-ed">
      {entries.map(([k, v], i) => (
        <div className="list-row" key={i}>
          <input className="input mono" style={{ maxWidth: 220 }} dir="ltr" value={k} onChange={(e) => rename(k, e.target.value)} />
          <input className="input" dir={dir} value={v} onChange={(e) => onChange({ ...value, [k]: e.target.value })} />
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon"
            style={{ color: 'var(--danger)' }}
            onClick={() => onChange(Object.fromEntries(entries.filter(([x]) => x !== k)))}
            aria-label="Remove"
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      ))}
      <div>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            let n = 1;
            while (`new_label_${n}` in value) n++;
            onChange({ ...value, [`new_label_${n}`]: '' });
          }}
        >
          <Icon name="plus" size={14} /> Add label
        </button>
      </div>
    </div>
  );
}

function Section({ id, title, desc, children }: { id: string; title: string; desc?: string; children: ReactNode }) {
  return (
    <section id={id} className="card anchor">
      <div className="card-head">
        <div>
          <h2>{title}</h2>
          {desc && <div className="help">{desc}</div>}
        </div>
      </div>
      <div className="card-body stack">{children}</div>
    </section>
  );
}

export function SettingsForm({ lang, data, updatedAt }: { lang: Lang; data: Rec; updatedAt: string | null }) {
  const router = useRouter();
  const { toast } = useUi();
  const [d, setD] = useState<Rec>(data);
  const [baseline, setBaseline] = useState(() => JSON.stringify(data));
  const [saving, setSaving] = useState(false);
  const { errors, reportError } = useFieldErrors();
  const dirty = useMemo(() => JSON.stringify(d) !== baseline, [d, baseline]);
  useUnsavedWarning(dirty && !saving);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const errorList = Object.values(errors);

  const set = (k: string, v: unknown) => setD((x) => ({ ...x, [k]: v }));
  const sub = (k: string) => (isPlainObject(d[k]) ? (d[k] as Rec) : {});
  const setSub = (k: string, kk: string, v: unknown) => setD((x) => ({ ...x, [k]: { ...(isPlainObject(x[k]) ? (x[k] as Rec) : {}), [kk]: v } }));
  const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));
  const text = (k: string, label: string, opts: { ltr?: boolean; help?: string } = {}) => (
    <Field label={label} help={opts.help}>
      <input className="input" dir={opts.ltr ? 'ltr' : dir} value={str(d[k])} onChange={(e) => set(k, e.target.value)} />
    </Field>
  );
  const arr = (k: string) => (Array.isArray(d[k]) ? (d[k] as Rec[]) : []);

  const schemaErr = useMemo(() => {
    const t = str(d.schema_global).trim();
    if (!t) return null;
    for (const [i, b] of t.split(/\n?<!--split-->\n?/).entries()) {
      try {
        if (b.trim()) JSON.parse(b);
      } catch (e) {
        return `Block ${i + 1} is not valid JSON: ${(e as Error).message}`;
      }
    }
    return null;
  }, [d.schema_global]);

  const save = useCallback(async () => {
    if (errorList.length) return toast(errorList[0], 'err');
    setSaving(true);
    const res = await saveSettings(lang, d);
    setSaving(false);
    if (!res.ok) return toast(res.error, 'err');
    setBaseline(JSON.stringify(d));
    toast('Settings saved — the website is updated');
    router.refresh();
  }, [errorList, lang, d, toast, router]);
  useSaveShortcut(save);

  const ctx = useMemo(() => ({ lang, reportError }), [lang, reportError]);
  const others = Object.keys(d).filter((k) => !HANDLED.has(k));
  const wa = sub('whatsapp');

  return (
    <FormContext.Provider value={ctx}>
      <div className="page-head">
        <div className="titles">
          <h1>Settings</h1>
          <p>
            Site-wide information for the {lang === 'ar' ? 'Arabic' : 'English'} website. {updatedAt ? `Last saved ${formatDate(updatedAt)}.` : ''}
          </p>
        </div>
        <div className="actions">
          <div className="seg">
            <Link href="/admin/settings?lang=ar" className={lang === 'ar' ? 'on' : ''}>
              Arabic
            </Link>
            <Link href="/admin/settings?lang=en" className={lang === 'en' ? 'on' : ''}>
              English
            </Link>
          </div>
          {dirty && <span className="badge badge-amber">Unsaved changes</span>}
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <Spinner /> : <Icon name="check" />} Save settings
          </button>
        </div>
      </div>
      <nav className="section-nav">
        {SECTIONS.filter(([id]) => id !== 'other' || others.length).map(([id, t]) => (
          <a key={id} href={`#${id}`}>
            {t}
          </a>
        ))}
      </nav>

      <div className="stack" style={{ maxWidth: 1000 }}>
        <Section id="branding" title="Logo">
          {text('logo_text', 'Logo text (header)')}
          <Field label="Logo (light, on dark backgrounds)">
            <MediaField value={str(d.logo_light)} onChange={(v) => set('logo_light', v)} />
          </Field>
          <Field label="Logo (dark, on light backgrounds)">
            <MediaField value={str(d.logo_dark)} onChange={(v) => set('logo_dark', v)} />
          </Field>
          {text('footer_logo_text', 'Footer logo text')}
        </Section>

        <Section id="contact" title="Phones & e-mail">
          <Field label="Phone numbers" help="Shown in the menu and footer, in this order.">
            <ListField name="phones" value={d.phones} onChange={(v) => set('phones', v)} />
          </Field>
          {text('email', 'E-mail', { ltr: true })}
        </Section>

        <Section id="addresses" title="Addresses" desc="Clinic branches shown in the menu, footer and contact page.">
          <ArrayEditor path="addresses" value={arr('addresses')} itemFields={ADDRESS_FIELDS} onChange={(v) => set('addresses', v)} />
        </Section>

        <Section id="whatsapp" title="WhatsApp button" desc="The floating WhatsApp chat button.">
          <div className="grid grid-2">
            <Field label="WhatsApp number" help="International format, e.g. +201040560000">
              <input className="input" dir="ltr" value={str(wa.number)} onChange={(e) => setSub('whatsapp', 'number', e.target.value)} />
            </Field>
            <Field label="Call-to-action text">
              <input className="input" dir="auto" value={str(wa.cta)} onChange={(e) => setSub('whatsapp', 'cta', e.target.value)} />
            </Field>
            <Field label="Color">
              <div className="input-group">
                <input type="color" value={/^#[0-9a-f]{6}$/i.test(str(wa.color)) ? str(wa.color) : '#25d366'} onChange={(e) => setSub('whatsapp', 'color', e.target.value)} style={{ width: 44, height: 36, padding: 2, border: '1px solid var(--line-strong)', borderRadius: 8 }} />
                <input className="input mono" dir="ltr" value={str(wa.color)} onChange={(e) => setSub('whatsapp', 'color', e.target.value)} />
              </div>
            </Field>
            <Field label="Position">
              <select className="select" value={str(wa.position) || 'right'} onChange={(e) => setSub('whatsapp', 'position', e.target.value)}>
                <option value="right">Bottom right</option>
                <option value="left">Bottom left</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section id="menu" title="Main menu" desc="Links of the top menu. Items with sub-links open a drop-down.">
          {text('menu_title', 'Menu title')}
          <NavEditor value={(Array.isArray(d.menu) ? d.menu : []) as Nav[]} onChange={(v) => set('menu', v)} />
        </Section>

        <Section id="footer" title="Footer">
          {text('footer_nav_title', 'Links column title')}
          <Field label="Footer links">
            <NavEditor depth={0} value={(Array.isArray(d.footer_nav) ? d.footer_nav : []) as Nav[]} onChange={(v) => set('footer_nav', v)} />
          </Field>
          {text('footer_contact_title', 'Contact column title')}
          {text('footer_address_title', 'Address column title')}
          <Field label="Bottom line (HTML)" help="The small text at the very bottom (copyright, developer link).">
            <AutoTextarea mono value={str(d.footer_bottom_html)} onChange={(v) => set('footer_bottom_html', v)} />
            {str(d.footer_bottom_html) && <div className="html-preview small" dir={dir} dangerouslySetInnerHTML={{ __html: str(d.footer_bottom_html) }} />}
          </Field>
        </Section>

        <Section id="socials" title="Social links" desc="Each place on the website has its own list.">
          {(
            [
              ['menu_socials', 'In the side menu'],
              ['footer_socials', 'In the footer'],
              ['side_socials', 'Fixed side bar'],
              ['hero_socials', 'Home page banner'],
            ] as const
          ).map(([k, label]) => (
            <Field key={k} label={label}>
              <ArrayEditor path={k} value={arr(k)} itemFields={SOCIAL_FIELDS} onChange={(v) => set(k, v)} />
            </Field>
          ))}
        </Section>

        <Section id="titles" title="Section titles">
          <div className="grid grid-2">
            {text('address_title', 'Address title')}
            {text('contact_title', 'Contact title')}
            {text('follow_title', '“Follow us” title')}
            {text('side_title', 'Side bar title')}
            <Field label="Menu button text">
              <input className="input" dir={dir} value={str(sub('toggle').menu)} onChange={(e) => setSub('toggle', 'menu', e.target.value)} />
            </Field>
            <Field label="“Open” text">
              <input className="input" dir={dir} value={str(sub('toggle').open)} onChange={(e) => setSub('toggle', 'open', e.target.value)} />
            </Field>
            <Field label="“Close” text">
              <input className="input" dir={dir} value={str(sub('toggle').close)} onChange={(e) => setSub('toggle', 'close', e.target.value)} />
            </Field>
            <Field label="Language switch label" help="e.g. EN / ع">
              <input className="input" dir="auto" value={str(sub('lang_switch').label)} onChange={(e) => setSub('lang_switch', 'label', e.target.value)} />
            </Field>
            <Field label="Language switch text">
              <input className="input" dir="auto" value={str(sub('lang_switch').text)} onChange={(e) => setSub('lang_switch', 'text', e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section id="tracking" title="Tracking & structured data">
          {text('gtm_id', 'Google Tag Manager ID', { ltr: true, help: 'e.g. GTM-XXXXXXX. Leave empty to disable.' })}
          <Field label="Global structured data (JSON-LD)" help="Added to every page. Several blocks can be separated with <!--split-->.">
            <AutoTextarea mono value={str(d.schema_global)} onChange={(v) => set('schema_global', v)} />
            {schemaErr && <span className="warn-text">⚠ {schemaErr}</span>}
          </Field>
        </Section>

        <Section id="labels" title="Labels" desc="Small texts used around the website (key → text).">
          <KeyValueEditor dir={dir} value={(isPlainObject(d.labels) ? d.labels : {}) as Record<string, string>} onChange={(v) => set('labels', v)} />
        </Section>

        {others.length > 0 && (
          <Section id="other" title="Other settings">
            {others.map((k) =>
              isPlainObject(d[k]) || Array.isArray(d[k]) ? (
                <Field key={k} label={k}>
                  <JsonText name={`settings.${k}`} value={d[k]} onChange={(v) => set(k, v)} />
                </Field>
              ) : (
                <FormField key={k} def={guessDef(k, d[k])} value={d[k]} onChange={(v) => set(k, v)} />
              ),
            )}
          </Section>
        )}
        {errorList.length > 0 && <div className="notice notice-error">{errorList[0]}</div>}
        <div>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <Spinner /> : <Icon name="check" />} Save settings
          </button>
        </div>
      </div>
    </FormContext.Provider>
  );
}
