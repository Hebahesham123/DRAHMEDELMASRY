'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { CONTENT_TAG } from '@/lib/supabase/public';
import { serviceClient } from '@/lib/supabase/service';
import { ITEM_TYPE_MAP, PAGE_MAP } from '@/lib/content-types';
import { AuthError, getAdminSession, requireAdmin, requireOwner } from './auth';
import { SLUG_BAD_CHARS, asLang, isPlainObject } from './util';

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

function fail(e: unknown): { ok: false; error: string } {
  if (e instanceof AuthError) return { ok: false, error: e.message };
  const err = e as { code?: string; message?: string };
  if (err?.code === '23505') return { ok: false, error: 'Another item of this type already uses this slug. Please choose a different one.' };
  if (err?.code === '42501') return { ok: false, error: 'You do not have permission to do this.' };
  return { ok: false, error: err?.message || 'Something went wrong. Please try again.' };
}

function contentChanged() {
  revalidateTag(CONTENT_TAG);
  revalidatePath('/admin', 'layout');
}

/* ------------------------------------------------------------------ */
/* auth                                                                */
/* ------------------------------------------------------------------ */

export async function signOut() {
  const { supabase } = await getAdminSession();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

/* ------------------------------------------------------------------ */
/* items                                                               */
/* ------------------------------------------------------------------ */

const TEXT_COLUMNS = ['title', 'excerpt', 'image', 'image_alt', 'detail_image', 'detail_image_alt', 'detail_image_title', 'body_html', 'link'] as const;

export interface ItemInput {
  id?: string | null;
  type: string;
  lang: string;
  slug: string;
  title?: string;
  excerpt?: string;
  image?: string;
  image_alt?: string;
  detail_image?: string;
  detail_image_alt?: string;
  detail_image_title?: string;
  body_html?: string;
  link?: string;
  extra?: Record<string, unknown>;
  seo?: Record<string, unknown>;
  sort_order?: number | null;
  featured?: boolean;
  published?: boolean;
}

export async function saveItem(input: ItemInput): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase } = await requireAdmin();
    const def = ITEM_TYPE_MAP[input.type];
    if (!def) return { ok: false, error: `Unknown content type "${input.type}".` };
    const slug = (input.slug || '').trim();
    if (!slug) return { ok: false, error: 'The slug cannot be empty.' };
    if (def.slugInUrl && SLUG_BAD_CHARS.test(slug)) return { ok: false, error: 'The slug cannot contain / ? # % or \\.' };

    const row: Record<string, unknown> = { type: input.type, lang: asLang(input.lang), slug };
    for (const c of TEXT_COLUMNS) if (input[c] !== undefined) row[c] = String(input[c] ?? '');
    if (input.extra !== undefined) row.extra = isPlainObject(input.extra) ? input.extra : {};
    if (input.seo !== undefined) row.seo = isPlainObject(input.seo) ? input.seo : {};
    if (input.featured !== undefined) row.featured = !!input.featured;
    if (input.published !== undefined) row.published = !!input.published;

    let sort = input.sort_order;
    if (sort === null || sort === undefined || Number.isNaN(Number(sort))) {
      if (!input.id) {
        const { data } = await supabase
          .from('items')
          .select('sort_order')
          .eq('type', input.type)
          .eq('lang', row.lang as string)
          .order('sort_order', { ascending: false })
          .limit(1);
        sort = (data?.[0]?.sort_order ?? -1) + 1;
      }
    }
    if (sort !== null && sort !== undefined) row.sort_order = Math.round(Number(sort));

    if (input.id) {
      const { data, error } = await supabase.from('items').update(row).eq('id', input.id).select('id').maybeSingle();
      if (error) throw error;
      if (!data) return { ok: false, error: 'This item no longer exists (it may have been deleted).' };
      contentChanged();
      return { ok: true, id: data.id };
    }
    const { data, error } = await supabase.from('items').insert(row).select('id').single();
    if (error) throw error;
    contentChanged();
    return { ok: true, id: data.id };
  } catch (e) {
    return fail(e);
  }
}

export async function setItemFlag(id: string, field: 'published' | 'featured', value: boolean): Promise<ActionResult> {
  try {
    if (field !== 'published' && field !== 'featured') return { ok: false, error: 'Invalid field' };
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('items').update({ [field]: !!value }).eq('id', id);
    if (error) throw error;
    contentChanged();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Saves the order of a list: ids[0] gets sort_order 0, ids[1] gets 1 … (only changed rows are written). */
export async function reorderItems(type: string, lang: string, ids: string[]): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase.from('items').select('id, sort_order').eq('type', type).eq('lang', asLang(lang));
    if (error) throw error;
    const current = new Map((data || []).map((r) => [r.id as string, r.sort_order as number]));
    const updates = ids.map((id, i) => ({ id, i })).filter(({ id, i }) => current.has(id) && current.get(id) !== i);
    const results = await Promise.all(updates.map(({ id, i }) => supabase.from('items').update({ sort_order: i }).eq('id', id)));
    const failed = results.find((r) => r.error);
    if (failed?.error) throw failed.error;
    contentChanged();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteItem(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) throw error;
    contentChanged();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------------------------ */
/* pages + settings                                                    */
/* ------------------------------------------------------------------ */

export async function savePage(key: string, lang: string, data: Record<string, unknown>, seo: Record<string, unknown>): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    if (!PAGE_MAP[key]) return { ok: false, error: `Unknown page "${key}".` };
    const l = asLang(lang);
    const { data: existing, error: e1 } = await supabase.from('pages').select('data, seo').eq('key', key).eq('lang', l).maybeSingle();
    if (e1) throw e1;
    // merge so values the form does not know about are kept
    const row = {
      key,
      lang: l,
      data: { ...(isPlainObject(existing?.data) ? existing.data : {}), ...(isPlainObject(data) ? data : {}) },
      seo: { ...(isPlainObject(existing?.seo) ? existing.seo : {}), ...(isPlainObject(seo) ? seo : {}) },
    };
    const { error } = await supabase.from('pages').upsert(row, { onConflict: 'key,lang' });
    if (error) throw error;
    contentChanged();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function saveSettings(lang: string, data: Record<string, unknown>): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const l = asLang(lang);
    const { data: existing, error: e1 } = await supabase.from('settings').select('data').eq('lang', l).maybeSingle();
    if (e1) throw e1;
    const merged = { ...(isPlainObject(existing?.data) ? existing.data : {}), ...(isPlainObject(data) ? data : {}) };
    const { error } = await supabase.from('settings').upsert({ lang: l, data: merged }, { onConflict: 'lang' });
    if (error) throw error;
    contentChanged();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Notify the public site after media changes (e.g. an image was replaced). */
export async function mediaChanged(): Promise<ActionResult> {
  try {
    await requireAdmin();
    revalidateTag(CONTENT_TAG);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------------------------ */
/* messages                                                            */
/* ------------------------------------------------------------------ */

export async function setMessageRead(ids: string[], read: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    if (!ids.length) return { ok: true };
    const { error } = await supabase.from('messages').update({ is_read: read }).in('id', ids);
    if (error) throw error;
    revalidatePath('/admin', 'layout');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteMessages(ids: string[]): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    if (!ids.length) return { ok: true };
    const { error } = await supabase.from('messages').delete().in('id', ids);
    if (error) throw error;
    revalidatePath('/admin', 'layout');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------------------------ */
/* dashboard users (owners only)                                       */
/* ------------------------------------------------------------------ */

async function findAuthUserByEmail(svc: ReturnType<typeof serviceClient>, email: string) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await svc.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const u = data.users.find((x) => (x.email || '').toLowerCase() === email);
    if (u) return u;
    if (data.users.length < 200) break;
  }
  return null;
}

export async function addAdmin(emailRaw: string, password: string, roleRaw: string): Promise<ActionResult<{ existed: boolean }>> {
  try {
    await requireOwner();
    const email = (emailRaw || '').trim().toLowerCase();
    const role = roleRaw === 'owner' ? 'owner' : 'editor';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Please enter a valid e-mail address.' };
    if ((password || '').length < 8) return { ok: false, error: 'The temporary password must have at least 8 characters.' };
    const svc = serviceClient();
    let existed = false;
    let userId: string;
    const { data, error } = await svc.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) {
      // the user may already exist in Auth (e.g. removed earlier) → reuse it and reset the password
      const existing = await findAuthUserByEmail(svc, email);
      if (!existing) throw error;
      const { error: e2 } = await svc.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
      if (e2) throw e2;
      userId = existing.id;
      existed = true;
    } else {
      userId = data.user.id;
    }
    const { error: e3 } = await svc.from('admins').upsert({ user_id: userId, email, role }, { onConflict: 'user_id' });
    if (e3) throw e3;
    revalidatePath('/admin/users');
    return { ok: true, existed };
  } catch (e) {
    return fail(e);
  }
}

async function ownerCount(supabase: Awaited<ReturnType<typeof requireOwner>>['supabase']) {
  const { count } = await supabase.from('admins').select('user_id', { count: 'exact', head: true }).eq('role', 'owner');
  return count ?? 0;
}

export async function setAdminRole(userId: string, roleRaw: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireOwner();
    const role = roleRaw === 'owner' ? 'owner' : 'editor';
    if (role === 'editor') {
      const { data: target } = await supabase.from('admins').select('role').eq('user_id', userId).maybeSingle();
      if (target?.role === 'owner' && (await ownerCount(supabase)) <= 1) return { ok: false, error: 'There must always be at least one owner.' };
    }
    const { error } = await supabase.from('admins').update({ role }).eq('user_id', userId);
    if (error) throw error;
    revalidatePath('/admin', 'layout');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function removeAdmin(userId: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireOwner();
    if (userId === user.id) return { ok: false, error: 'You cannot remove yourself.' };
    const { data: target } = await supabase.from('admins').select('role').eq('user_id', userId).maybeSingle();
    if (target?.role === 'owner' && (await ownerCount(supabase)) <= 1) return { ok: false, error: 'There must always be at least one owner.' };
    const { error } = await supabase.from('admins').delete().eq('user_id', userId);
    if (error) throw error;
    revalidatePath('/admin/users');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
