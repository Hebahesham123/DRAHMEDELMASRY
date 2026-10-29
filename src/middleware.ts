import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * - /admin: keeps the Supabase login session fresh.
 * - public site: the old site was hosted on IIS, where URLs are case-insensitive
 *   (/bariatricSurgeryDetail and /bariatricsurgeryDetail both work). Our route
 *   folders are lower-case, so the first path segment is lower-cased internally.
 * - ?clang=1 (Arabic) / ?clang=2 (English) sets the language cookie, like the old site.
 */

const LOWERCASE_SEGMENTS = new Set([
  'aboutus', 'faqs', 'faqdetail', 'cv', 'testimonials', 'bariatricsurgeries', 'generalsurgeries',
  'bariatricsurgerydetail', 'generalsurgerydetail', 'successstories', 'successstorydetail',
  'surgerytips', 'surgerytipdetail', 'videos', 'gallery', 'contactus', 'privacypolicy',
  'itemnotfound', 'taketour', 'home',
  'download_free_book_nutrition_after_bariatric_surgeries_ar',
  'download_free_book_nutrition_after_bariatric_surgeries_en',
  'download_free_book_nutrition_for_ramadan_surgeries_ar',
  'download_free_book_nutrition_for_ramadan_surgeries_en',
]);

const LANG_COOKIE = 'clang';

async function refreshAdminSession(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return refreshAdminSession(req);
  }

  const headers = new Headers(req.headers);
  headers.set('x-pathname', pathname);

  // language switch (?clang=1 Arabic, ?clang=2 English)
  const clang = searchParams.get('clang');
  let setLang: string | null = null;
  if (clang === '1' || clang === '2') {
    setLang = clang === '2' ? 'en' : 'ar';
    headers.set('x-lang', setLang);
  }

  const segs = pathname.split('/');
  const first = segs[1] || '';
  let res: NextResponse;
  if (first && first !== first.toLowerCase() && LOWERCASE_SEGMENTS.has(first.toLowerCase())) {
    const url = req.nextUrl.clone();
    segs[1] = first.toLowerCase();
    url.pathname = segs.join('/');
    res = NextResponse.rewrite(url, { request: { headers } });
  } else {
    res = NextResponse.next({ request: { headers } });
  }
  if (setLang) res.cookies.set(LANG_COOKIE, setLang, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  return res;
}

export const config = {
  matcher: ['/((?!_next/|api/|assets/|Content/|ApplicationImages/|tinymce/|favicon.ico|robots.txt|sitemap.xml).*)'],
};
