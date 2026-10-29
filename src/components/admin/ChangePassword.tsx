'use client';

import { useState } from 'react';
import { browserClient } from '@/lib/supabase/browser';
import { Field } from './fields';
import { Spinner, useUi } from './ui';

export function ChangePassword({ email }: { email: string }) {
  const { toast } = useUi();
  const [current, setCurrent] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (pw.length < 8) return setError('The new password must have at least 8 characters.');
    if (pw !== pw2) return setError('The two new passwords are not the same.');
    setBusy(true);
    const sb = browserClient();
    const { error: e1 } = await sb.auth.signInWithPassword({ email, password: current });
    if (e1) {
      setBusy(false);
      return setError('Your current password is not correct.');
    }
    const { error: e2 } = await sb.auth.updateUser({ password: pw });
    setBusy(false);
    if (e2) return setError(e2.message);
    setCurrent('');
    setPw('');
    setPw2('');
    toast('Password changed');
  }

  return (
    <form className="stack" onSubmit={submit}>
      <Field label="Current password">
        <input className="input" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
      </Field>
      <Field label="New password" help="At least 8 characters.">
        <input className="input" type="password" autoComplete="new-password" required value={pw} onChange={(e) => setPw(e.target.value)} />
      </Field>
      <Field label="Repeat the new password">
        <input className="input" type="password" autoComplete="new-password" required value={pw2} onChange={(e) => setPw2(e.target.value)} />
      </Field>
      {error && <div className="notice notice-error">{error}</div>}
      <div>
        <button className="btn btn-primary" disabled={busy} type="submit">
          {busy && <Spinner />} Change password
        </button>
      </div>
    </form>
  );
}
