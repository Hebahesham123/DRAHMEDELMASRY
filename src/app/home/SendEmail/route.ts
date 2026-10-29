import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/** Contact form handler — same address the old site used (/Home/SendEmail). */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const get = (k: string) => String(form.get(k) ?? '').trim().slice(0, 5000);
  const row = {
    name: get('name'),
    email: get('email'),
    phone: get('phone'),
    message: get('message'),
    lang: get('lang') === 'en' ? 'en' : 'ar',
    page: get('page'),
  };
  const back = new URL(req.headers.get('referer') || '/', req.url);
  if (row.name && (row.phone || row.email)) {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { error } = await sb.from('messages').insert(row);
    if (!error) back.searchParams.set('sent', '1');
    else console.error('contact form:', error.message);
  }
  back.hash = 'contact-form';
  return NextResponse.redirect(back, 303);
}
