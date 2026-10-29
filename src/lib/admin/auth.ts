import 'server-only';
import { cache } from 'react';
import { serverClient } from '@/lib/supabase/server';

export type Role = 'owner' | 'editor';

export interface AdminSession {
  supabase: Awaited<ReturnType<typeof serverClient>>;
  user: { id: string; email: string } | null;
  admin: { user_id: string; email: string; role: Role } | null;
}

/** Current user + admins row (cached per request). */
export const getAdminSession = cache(async (): Promise<AdminSession> => {
  const supabase = await serverClient();
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) return { supabase, user: null, admin: null };
  const { data: row } = await supabase.from('admins').select('user_id, email, role').eq('user_id', u.id).maybeSingle();
  return {
    supabase,
    user: { id: u.id, email: u.email || '' },
    admin: row ? { user_id: row.user_id, email: row.email, role: row.role === 'owner' ? 'owner' : 'editor' } : null,
  };
});

export class AuthError extends Error {}

/** For server actions: throws unless the caller is a dashboard user. */
export async function requireAdmin() {
  const s = await getAdminSession();
  if (!s.user || !s.admin) throw new AuthError('You are not signed in, or you do not have access to the dashboard.');
  return s as AdminSession & { user: NonNullable<AdminSession['user']>; admin: NonNullable<AdminSession['admin']> };
}

export async function requireOwner() {
  const s = await requireAdmin();
  if (s.admin.role !== 'owner') throw new AuthError('Only owners can manage dashboard users.');
  return s;
}
