import { storageKey } from '@/lib/storage-key';

/**
 * Serves the original image/PDF addresses (/ApplicationImages/…) from the
 * Supabase Storage bucket "media", so every old link keeps working.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const rel = ['ApplicationImages', ...path.map((p) => {
    try {
      return decodeURIComponent(p);
    } catch {
      return p;
    }
  })].join('/');
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/`;
  const upstream = await fetch(base + encodeURI(storageKey(rel)), { next: { revalidate: 86400 } } as RequestInit);
  if (!upstream.ok) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  headers.set('content-type', upstream.headers.get('content-type') || 'application/octet-stream');
  const len = upstream.headers.get('content-length');
  if (len) headers.set('content-length', len);
  headers.set('cache-control', 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400');
  return new Response(upstream.body, { status: 200, headers });
}
