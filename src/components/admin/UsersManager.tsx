'use client';

import { useState } from 'react';
import { addAdmin, removeAdmin, setAdminRole } from '@/lib/admin/actions';
import { formatDate } from '@/lib/admin/util';
import { Field } from './fields';
import { Icon } from './Icon';
import { Modal, Spinner, useUi } from './ui';

interface AdminRow {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
}

function randomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const a = new Uint32Array(12);
  crypto.getRandomValues(a);
  return Array.from(a, (n) => chars[n % chars.length]).join('');
}

export function UsersManager({ users, me }: { users: AdminRow[]; me: string }) {
  const { toast, confirm } = useUi();
  const [form, setForm] = useState<{ email: string; password: string; role: string; reset?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    const res = await addAdmin(form.email, form.password, form.role);
    setBusy(false);
    if (!res.ok) return toast(res.error, 'err');
    toast(form.reset ? 'Password reset' : res.existed ? 'Existing account given access (password reset)' : 'User added');
    setForm(null);
  }

  async function changeRole(u: AdminRow, role: string) {
    const res = await setAdminRole(u.user_id, role);
    if (!res.ok) toast(res.error, 'err');
    else toast(`${u.email} is now ${role === 'owner' ? 'an owner' : 'an editor'}`);
  }

  async function remove(u: AdminRow) {
    const ok = await confirm({ title: 'Remove dashboard access?', text: `${u.email} will no longer be able to sign in to the dashboard.`, confirmLabel: 'Remove access', danger: true });
    if (!ok) return;
    const res = await removeAdmin(u.user_id);
    if (!res.ok) toast(res.error, 'err');
    else toast('Access removed');
  }

  return (
    <div className="card">
      <div className="card-head">
        <h2>{users.length} users</h2>
        <div className="spacer" />
        <button className="btn btn-primary btn-sm" onClick={() => setForm({ email: '', password: randomPassword(), role: 'editor' })}>
          <Icon name="plus" size={14} /> Add user
        </button>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>E-mail</th>
              <th style={{ width: 170 }}>Role</th>
              <th style={{ width: 160 }}>Added</th>
              <th style={{ width: 230, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                <td>
                  <b>{u.email}</b> {u.user_id === me && <span className="badge badge-blue">you</span>}
                </td>
                <td>
                  <select className="select" value={u.role} onChange={(e) => changeRole(u, e.target.value)} style={{ height: 30 }}>
                    <option value="owner">Owner</option>
                    <option value="editor">Editor</option>
                  </select>
                </td>
                <td className="small muted">{formatDate(u.created_at)}</td>
                <td>
                  <div className="row-nowrap" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm" onClick={() => setForm({ email: u.email, password: randomPassword(), role: u.role, reset: true })}>
                      <Icon name="key" size={14} /> Reset password
                    </button>
                    {u.user_id !== me && (
                      <button className="btn btn-sm btn-danger" onClick={() => remove(u)}>
                        <Icon name="trash" size={14} /> Remove
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {form && (
        <Modal title={form.reset ? `Reset password for ${form.email}` : 'Add a dashboard user'} onClose={() => setForm(null)}>
          <form onSubmit={submit}>
            <div className="modal-body stack">
              {!form.reset && (
                <Field label="E-mail">
                  <input className="input" type="email" required autoFocus value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </Field>
              )}
              <Field label={form.reset ? 'New temporary password' : 'Temporary password'} help="Send it to the person; they can change it from “Change password” after signing in.">
                <div className="input-group">
                  <input className="input mono" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  <button type="button" className="btn btn-sm" onClick={() => setForm({ ...form, password: randomPassword() })}>
                    <Icon name="refresh" size={14} /> New
                  </button>
                </div>
              </Field>
              {!form.reset && (
                <Field label="Role">
                  <select className="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="editor">Editor — can change all content</option>
                    <option value="owner">Owner — can also manage users</option>
                  </select>
                </Field>
              )}
            </div>
            <div className="modal-foot">
              <button type="button" className="btn" onClick={() => setForm(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" type="submit" disabled={busy}>
                {busy && <Spinner />} {form.reset ? 'Reset password' : 'Add user'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
