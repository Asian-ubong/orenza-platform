'use client';

import { FormEvent, useEffect, useState } from 'react';

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  email_confirmed: boolean;
  created_at: string;
  last_sign_in_at?: string | null;
  disabled: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Could not load users (${response.status}).`);
      setUsers(Array.isArray(result.users) ? result.users : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function createAccount(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Account creation failed (${response.status}).`);
      setMessage(`Account created for ${result.user?.email || form.email}.`);
      setForm({ full_name: '', email: '', phone: '', password: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Account creation failed.');
    } finally {
      setSaving(false);
    }
  }

  return <div style={{ display: 'grid', gap: 20 }}>
    <form onSubmit={createAccount} className="card" style={{ padding: 20 }}>
      <p className="eyebrow">CREATE USER ACCOUNT</p>
      <h2 style={{ marginTop: 6 }}>Create a customer account</h2>
      <p className="muted">Creates a real Supabase Auth account, confirms the email, and creates the corresponding ORENZA profile. This action is restricted to authorized administrators.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginTop: 16 }}>
        <input required minLength={2} placeholder="Full name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
        <input required type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Phone (optional)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <input required minLength={8} type="password" placeholder="Temporary password (8+ chars)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
      </div>
      <button className="adminButton" type="submit" disabled={saving} style={{ marginTop: 14 }}>{saving ? 'Creating account…' : 'Create account'}</button>
      {message && <p className="goodText" role="status" style={{ marginTop: 12 }}>{message}</p>}
      {error && <p className="dangerText" role="alert" style={{ marginTop: 12 }}>{error}</p>}
    </form>

    <section className="card" style={{ padding: 20 }}>
      <div className="sectionHead"><div><p className="eyebrow">DIRECTORY</p><h2>Platform users</h2></div><button className="adminButton secondary" onClick={() => void load()} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button></div>
      {loading ? <p className="muted">Loading users…</p> : users.length === 0 ? <p className="muted">No accounts found.</p> : <div className="adminTableWrap"><table><thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Created</th><th>Last sign-in</th></tr></thead><tbody>{users.map(user => <tr key={user.id}><td>{user.full_name || '—'}</td><td>{user.email}</td><td><span className="status">{user.disabled ? 'Disabled' : user.email_confirmed ? 'Active' : 'Unconfirmed'}</span></td><td>{new Date(user.created_at).toLocaleDateString()}</td><td>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
