'use client';

import { useState } from 'react';
import { browserClient } from '@/lib/supabase/browser';
import { Spinner } from './ui';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error } = await browserClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      setError(/invalid/i.test(error.message) ? 'Wrong e-mail or password.' : error.message);
      return;
    }
    // full navigation so the server sees the new session cookies
    window.location.assign('/admin');
  }

  return (
    <form onSubmit={submit} className="stack">
      <h1>Sign in</h1>
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input id="email" className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <div className="notice notice-error">{error}</div>}
      <button className="btn btn-primary btn-block" disabled={busy} type="submit">
        {busy && <Spinner />} Sign in
      </button>
      <p className="help">Forgot your password? Ask the website owner to reset it from the dashboard&apos;s Users page.</p>
    </form>
  );
}
