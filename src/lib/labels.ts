import type { Lang, Settings } from '@/lib/types';

/** Small fixed texts used by the templates. They can be overridden from Settings → labels. */
const DEFAULTS: Record<Lang, Record<string, string>> = {
  ar: {
    back: 'عودة',
    more: 'المزيد',
    services: 'الخدمات',
    toc: 'جدول المحتويات',
  },
  en: {
    back: 'Back',
    more: 'Read More',
    services: 'Services',
    toc: 'Table of Content',
  },
};

export function label(s: Settings | undefined, lang: Lang, key: string): string {
  return s?.labels?.[key] || DEFAULTS[lang][key] || key;
}
