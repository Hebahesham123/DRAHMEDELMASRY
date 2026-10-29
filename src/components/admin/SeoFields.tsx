'use client';

import { SEO_FIELDS } from '@/lib/content-types';
import { getPath, type Rec } from '@/lib/admin/util';
import { Field, FieldInput, useForm } from './fields';

function schemaProblems(text: string): string | null {
  if (!text.trim()) return null;
  const blocks = text.split(/\n?<!--split-->\n?/);
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i].trim();
    if (!b) continue;
    try {
      JSON.parse(b.replace(/^<script[^>]*>|<\/script>$/gi, ''));
    } catch (e) {
      return `Block ${i + 1} is not valid JSON: ${(e as Error).message}`;
    }
  }
  return null;
}

/** SEO form over a seo jsonb object; keys without a field (og_url …) are kept and shown at the end. */
export function SeoFields({ value, onChange }: { value: Rec; onChange: (v: Rec) => void }) {
  const { lang } = useForm();
  const known = new Set(SEO_FIELDS.map((f) => f.name));
  const others = Object.keys(value).filter((k) => !known.has(k));
  const title = String(value.title || '');
  const desc = String(value.description || '');
  return (
    <>
      <div className="notice">These texts are what Google and social networks show. Leave a field empty to use the default.</div>
      {SEO_FIELDS.map((f) => {
        const v = getPath(value, f.name);
        const extraHelp =
          f.name === 'title' ? `${title.length} characters (ideal: up to ~60)` : f.name === 'description' ? `${desc.length} characters (ideal: up to ~160)` : null;
        const err = f.name === 'schema' ? schemaProblems(String(v || '')) : null;
        return (
          <Field key={f.name} label={f.label} help={[f.help, extraHelp].filter(Boolean).join(' · ') || undefined}>
            <FieldInput def={f.name === 'schema' ? { ...f, name: 'seo.schema' } : f} value={v} onChange={(nv) => onChange({ ...value, [f.name]: nv })} />
            {err && <span className="warn-text">⚠ {err}</span>}
          </Field>
        );
      })}
      {others.length > 0 && (
        <div className="fieldset">
          <div className="fieldset-title">Other stored SEO values</div>
          {others.map((k) => (
            <Field key={k} label={k}>
              <input
                className="input mono"
                dir={lang === 'ar' && !/url|hreflang|canonical/.test(k) ? 'auto' : 'ltr'}
                value={typeof value[k] === 'string' ? (value[k] as string) : JSON.stringify(value[k])}
                onChange={(e) => onChange({ ...value, [k]: e.target.value })}
              />
            </Field>
          ))}
        </div>
      )}
    </>
  );
}
