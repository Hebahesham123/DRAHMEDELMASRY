'use client';
import { useEffect } from 'react';

/**
 * The original theme scripts (GSAP, Swiper, isotope, fancybox …) start on
 * DOMContentLoaded and change the page heavily. They are loaded only after React
 * has hydrated, and the DOMContentLoaded event is replayed for them.
 */
declare global {
  interface Window {
    __themeLoaded?: boolean;
    __dsnQueue?: Array<() => void>;
  }
}

function load(src: string) {
  return new Promise<void>((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.async = false;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error('failed to load ' + src));
    document.body.appendChild(el);
  });
}

/**
 * The theme swaps pages with AJAX and sets the new <title>, but Next.js then
 * restores its own head. Re-apply the title of the page that was loaded.
 */
function keepTitleAfterAjax() {
  const $ = (window as unknown as { jQuery?: (d: Document) => { ajaxSuccess: (fn: (e: unknown, xhr: { responseText?: string }) => void) => void } }).jQuery;
  if (!$) return;
  let next: string | null = null;
  $(document).ajaxSuccess((_e, xhr) => {
    const m = (xhr.responseText || '').match(/<title[^>]*>([^<]*)<\/title>/);
    if (m) {
      const el = document.createElement('textarea');
      el.innerHTML = m[1];
      next = el.value;
    }
  });
  window.addEventListener('dsn/ajax/afterSuccess', () => {
    if (!next) return;
    const t = next;
    [0, 100, 500, 1500].forEach((ms) => setTimeout(() => (document.title = t), ms));
  });
}

export default function ThemeScripts({ lang }: { lang: 'ar' | 'en' }) {
  useEffect(() => {
    if (window.__themeLoaded) return;
    window.__themeLoaded = true;
    const suffix = lang === 'ar' ? '-ar' : '';
    // page scripts (form validation, pagination) wait until React has hydrated
    for (const fn of window.__dsnQueue || []) {
      try {
        fn();
      } catch (e) {
        console.error(e);
      }
    }
    window.__dsnQueue = { push: (fn: () => void) => fn() } as unknown as Array<() => void>;
    (async () => {
      await load(`/assets/js/plugins.min${suffix}.js`);
      await load('/assets/js/plugins/dsn-grid.min.js');
      await load(`/assets/js/custom${suffix}.js`);
      document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true, cancelable: true }));
      keepTitleAfterAjax();
    })().catch((e) => console.error(e));
  }, [lang]);
  return null;
}
