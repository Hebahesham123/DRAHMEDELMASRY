import { revalidateTag } from 'next/cache';
import { CONTENT_TAG } from '@/lib/supabase/public';

/** Clears the website cache. Used by scripts/import.mjs after loading content. */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  revalidateTag(CONTENT_TAG);
  return Response.json({ ok: true });
}
