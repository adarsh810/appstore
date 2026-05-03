'use client';

import { useEffect, useState } from 'react';
import type { App, Rating } from '@/lib/types';

const RATINGS: Rating[] = ['great', 'good', 'bad'];

const emptyForm = { name: '', description: '', url: '', screenshot_url: '', rating: 'good' as Rating };

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');

  const [apps, setApps] = useState<App[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const headers = { 'Content-Type': 'application/json', 'x-admin-password': password };

  const load = () =>
    fetch('/api/apps').then((r) => r.json()).then(setApps);

  const login = async () => {
    const res = await fetch('/api/apps', { method: 'POST', headers, body: JSON.stringify({ name: '__test__' }) });
    if (res.status === 401) { setAuthError('Wrong password.'); return; }
    // undo the test insert
    const data = await res.json();
    if (data.id) await fetch(`/api/apps/${data.id}`, { method: 'DELETE', headers });
    setAuthed(true);
    load();
  };

  useEffect(() => { if (authed) load(); }, [authed]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const url = editId ? `/api/apps/${editId}` : '/api/apps';
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setForm(emptyForm);
      setEditId(null);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
    setSaving(false);
  };

  const del = async (id: string) => {
    if (!confirm('Delete this app?')) return;
    await fetch(`/api/apps/${id}`, { method: 'DELETE', headers });
    load();
  };

  const startEdit = (app: App) => {
    setEditId(app.id);
    setForm({ name: app.name, description: app.description || '', url: app.url || '', screenshot_url: app.screenshot_url || '', rating: app.rating || 'good' });
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-sm shadow-sm">
          <h1 className="text-xl font-extrabold mb-6">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            placeholder="Password"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 outline-none focus:border-gray-400"
          />
          {authError && <p className="text-red-500 text-xs mb-3">{authError}</p>}
          <button onClick={login} className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-700">
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-xl font-extrabold">Admin</h1>
          <a href="/" className="text-sm text-gray-500 hover:text-gray-900">← Store</a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="font-bold mb-4">{editId ? 'Edit App' : 'Add App'}</h2>
          <div className="space-y-3">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="App name *"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 resize-none"
            />
            <input
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="App URL (https://...)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
            />
            <input
              value={form.screenshot_url}
              onChange={(e) => setForm((f) => ({ ...f, screenshot_url: e.target.value }))}
              placeholder="Screenshot URL (optional)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
            />
            <div className="flex gap-2">
              {RATINGS.map((r) => (
                <button
                  key={r}
                  onClick={() => setForm((f) => ({ ...f, rating: r }))}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border capitalize transition-colors ${
                    form.rating === r
                      ? r === 'great' ? 'bg-green-100 border-green-400 text-green-700'
                        : r === 'good' ? 'bg-blue-100 border-blue-400 text-blue-700'
                        : 'bg-red-100 border-red-400 text-red-600'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button
              onClick={save}
              disabled={saving || !form.name}
              className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : editId ? 'Update' : 'Add App'}
            </button>
            {editId && (
              <button
                onClick={() => { setEditId(null); setForm(emptyForm); }}
                className="px-5 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* App list */}
        <div className="space-y-3">
          {apps.map((app) => (
            <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{app.name}</div>
                {app.description && <div className="text-xs text-gray-400 truncate mt-0.5">{app.description}</div>}
              </div>
              {app.rating && (
                <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                  app.rating === 'great' ? 'bg-green-100 text-green-700'
                    : app.rating === 'good' ? 'bg-blue-100 text-blue-700'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {app.rating}
                </span>
              )}
              <button onClick={() => startEdit(app)} className="text-xs text-gray-400 hover:text-gray-700 shrink-0">Edit</button>
              <button onClick={() => del(app.id)} className="text-xs text-red-400 hover:text-red-600 shrink-0">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
