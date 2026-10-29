import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** Supabase client bound to the signed-in user's cookies (server components / actions). */
export async function serverClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // called from a server component — the middleware refreshes the session instead
        }
      },
    },
  });
}
