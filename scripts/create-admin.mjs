#!/usr/bin/env node
/**
 * Creates (or repairs) a dashboard user.
 *
 *   node scripts/create-admin.mjs <email> <password> [owner|editor]
 *
 * - creates the Supabase Auth user (e-mail already confirmed) if it does not exist,
 *   otherwise resets its password;
 * - makes sure the user has a row in public.admins with the given role (default: owner).
 * Safe to run several times.
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (reads .env.local).
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const f of ['.env.local', '.env']) {
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const [emailArg, password, roleArg = 'owner'] = process.argv.slice(2);
if (!emailArg || !password) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password> [owner|editor]');
  process.exit(1);
}
const email = emailArg.trim().toLowerCase();
const role = roleArg === 'editor' ? 'editor' : 'owner';
if (password.length < 6) {
  console.error('The password must have at least 6 characters.');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function findUser(mail) {
  for (let page = 1; page < 100; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const u = data.users.find((x) => (x.email || '').toLowerCase() === mail);
    if (u) return u;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function main() {
  let user = await findUser(email);
  if (user) {
    const { error } = await sb.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    if (error) throw error;
    console.log(`User ${email} already existed — password reset.`);
  } else {
    const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    user = data.user;
    console.log(`User ${email} created.`);
  }
  const { error } = await sb.from('admins').upsert({ user_id: user.id, email, role }, { onConflict: 'user_id' });
  if (error) throw error;
  console.log(`${email} is now a dashboard ${role}. Sign in at /admin/login`);
}

main().catch((e) => {
  console.error('Failed:', e.message || e);
  process.exit(1);
});
