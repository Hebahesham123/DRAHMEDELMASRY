import { createClient } from '@supabase/supabase-js';

/**
 * Read-only client for the public website. Requests are cached by Next.js and
 * tagged "content"; the dashboard calls revalidateTag('content') after every
 * change so the site updates right away.
 */
export const CONTENT_TAG = 'content';

export function publicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, next: { tags: [CONTENT_TAG], revalidate: 3600 } } as RequestInit),
    },
  });
}
