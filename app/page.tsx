'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import type { App, Rating } from '@/lib/types';

const RATING_CONFIG: Record<Rating, { label: string; bg: string; text: string; dot: string; activeBorder: string }> = {
  great: { label: 'Great', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', activeBorder: 'border-green-400' },
  good:  { label: 'Good',  bg: 'bg-blue-100',  text: 'text-blue-700',  dot: 'bg-blue-500',  activeBorder: 'border-blue-400'  },
  bad:   { label: 'Bad',   bg: 'bg-red-100',   text: 'text-red-600',   dot: 'bg-red-400',   activeBorder: 'border-red-300'   },
};

const RATINGS: Rating[] = ['great', 'good', 'bad'];
const ALL_TAGS = ['AI', 'Dev Tools', 'Productivity', 'Finance', 'Design', 'Fun'];
const emptyForm = { name: '', description: '', url: '', rating: 'good' as Rating, tags: [] as string[] };

export default function StorePage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin auth
  const [adminMode, setAdminMode] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [authError, setAuthError] = useState('');

  // Add / edit form
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Search + filter
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const headers = { 'Content-Type': 'application/json', 'x-admin-password': password };

  const load = () =>
    fetch('/api/apps').then((r) => r.json()).then((d) => { setApps(d); setLoading(false); });

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_pw');
    if (saved) { setPassword(saved); setAdminMode(true); }
  }, []);

  const login = async (pw: string) => {
    const res = await fetch('/api/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': pw },
      body: JSON.stringify({ name: '__auth_check__' }),
    });
    if (res.status === 401) { setAuthError('Wrong password.'); return; }
    const data = await res.json();
    if (data.id) {
      await fetch(`/api/apps/${data.id}`, { method: 'DELETE', headers: { 'x-admin-password': pw } });
    }
    sessionStorage.setItem('admin_pw', pw);
    setPassword(pw);
    setAdminMode(true);
    setShowPasswordModal(false);
    setAuthError('');
  };

  const logout = () => {
    sessionStorage.removeItem('admin_pw');
    setAdminMode(false);
    setPassword('');
    setEditId(null);
    setForm(emptyForm);
    setScreenshotUrl('');
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/apps/upload', { method: 'POST', headers: { 'x-admin-password': password }, body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.url) setScreenshotUrl(data.url);
    else setFormError(data.error || 'Upload failed');
  };

  const save = async () => {
    setSaving(true);
    setFormError('');
    try {
      const payload = { ...form, screenshot_url: screenshotUrl || null };
      const url = editId ? `/api/apps/${editId}` : '/api/apps';
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setForm(emptyForm);
      setEditId(null);
      setScreenshotUrl('');
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (e) {
      setFormError((e as Error).message);
    }
    setSaving(false);
  };

  const startEdit = (app: App) => {
    setEditId(app.id);
    setForm({ name: app.name, description: app.description || '', url: app.url || '', rating: app.rating || 'good', tags: app.tags ?? [] });
    setScreenshotUrl(app.screenshot_url || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const del = async (id: string) => {
    if (!confirm('Delete this app?')) return;
    await fetch(`/api/apps/${id}`, { method: 'DELETE', headers });
    load();
  };

  const updateRating = async (id: string, rating: Rating) => {
    setApps((prev) => prev.map((a) => a.id === id ? { ...a, rating } : a));
    await fetch(`/api/apps/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ rating }) });
  };

  const toggleFormTag = (tag: string) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  // All tags that exist across loaded apps (for filter pills)
  const existingTags = useMemo(() => {
    const set = new Set<string>();
    apps.forEach((a) => (a.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [apps]);

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || a.name.toLowerCase().includes(q) || (a.description ?? '').toLowerCase().includes(q);
      const matchesTag = !activeTag || (a.tags ?? []).includes(activeTag);
      return matchesSearch && matchesTag;
    });
  }, [apps, search, activeTag]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">App Store</h1>
            <p className="text-gray-400 text-xs hidden sm:block">Apps built by Adarsh — rated honestly.</p>
          </div>
          <div className="flex items-center gap-2">
            {adminMode ? (
              <>
                <span className="text-xs font-bold px-2.5 py-1 bg-orange-100 text-orange-600 rounded-full">Admin</span>
                <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg">Exit</button>
              </>
            ) : (
              <button
                onClick={() => setShowPasswordModal(true)}
                className="text-xs font-semibold px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
              >
                Admin
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Password modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-extrabold text-lg mb-4">Admin Login</h2>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login(password)}
              placeholder="Password"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 outline-none focus:border-gray-400"
            />
            {authError && <p className="text-red-500 text-xs mb-2">{authError}</p>}
            <div className="flex gap-2">
              <button onClick={() => login(password)} className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-700">Login</button>
              <button onClick={() => { setShowPasswordModal(false); setAuthError(''); setPassword(''); }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Admin add/edit form */}
        {adminMode && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm mb-8">
            <h2 className="font-bold mb-4 text-sm">{editId ? 'Edit App' : 'Add App'}</h2>
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
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 resize-none"
              />
              <input
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="App URL (https://...)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
              />

              {/* Screenshot upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Screenshot</label>
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="cursor-pointer px-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-colors">
                    {uploading ? 'Uploading…' : 'Upload JPEG / PNG'}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                    />
                  </label>
                  {screenshotUrl && (
                    <div className="flex items-center gap-2">
                      <img src={screenshotUrl} alt="preview" className="h-10 w-16 object-cover rounded border border-gray-200" />
                      <button onClick={() => { setScreenshotUrl(''); if (fileRef.current) fileRef.current.value = ''; }} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Tags</label>
                <div className="flex gap-2 flex-wrap">
                  {ALL_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleFormTag(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                        form.tags.includes(tag)
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'border-gray-200 text-gray-400 hover:border-gray-400'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating picker */}
              <div className="flex gap-2 flex-wrap">
                {RATINGS.map((r) => {
                  const cfg = RATING_CONFIG[r];
                  return (
                    <button
                      key={r}
                      onClick={() => setForm((f) => ({ ...f, rating: r }))}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold border capitalize transition-colors ${
                        form.rating === r ? `${cfg.bg} ${cfg.text} ${cfg.activeBorder}` : 'border-gray-200 text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
            {formError && <p className="text-red-500 text-xs mt-2">{formError}</p>}
            <div className="flex gap-2 mt-4">
              <button
                onClick={save}
                disabled={saving || !form.name || uploading}
                className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : editId ? 'Update' : 'Add App'}
              </button>
              {editId && (
                <button onClick={() => { setEditId(null); setForm(emptyForm); setScreenshotUrl(''); }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search + tag filters */}
        {!loading && apps.length > 0 && (
          <div className="mb-6 space-y-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search apps…"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-400 bg-white"
            />
            {existingTags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setActiveTag(null)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    !activeTag ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  All
                </button>
                {existingTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                      activeTag === tag ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* App grid */}
        {loading && <div className="text-center text-gray-400 py-20 text-sm">Loading apps…</div>}

        {!loading && apps.length === 0 && (
          <div className="text-center text-gray-400 py-20 text-sm">No apps yet.</div>
        )}

        {!loading && filtered.length === 0 && apps.length > 0 && (
          <div className="text-center text-gray-400 py-20 text-sm">No apps match your search.</div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filtered.map((app) => {
              const rating = app.rating ? RATING_CONFIG[app.rating] : null;
              return (
                <div key={app.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  {app.screenshot_url ? (
                    <img src={app.screenshot_url} alt={app.name} className="w-full h-44 object-cover border-b border-gray-100" />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl border-b border-gray-100">📦</div>
                  )}

                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h2 className="font-bold text-base leading-snug">{app.name}</h2>
                      {adminMode ? (
                        <div className="flex gap-1 shrink-0">
                          {RATINGS.map((r) => {
                            const cfg = RATING_CONFIG[r];
                            const active = app.rating === r;
                            return (
                              <button
                                key={r}
                                onClick={() => updateRating(app.id, r)}
                                title={cfg.label}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${active ? `${cfg.dot} border-transparent` : 'bg-gray-100 border-gray-200 hover:border-gray-400'}`}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        rating && (
                          <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${rating.bg} ${rating.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${rating.dot}`} />
                            {rating.label}
                          </span>
                        )
                      )}
                    </div>

                    {app.description && <p className="text-sm text-gray-500 leading-relaxed flex-1">{app.description}</p>}

                    {/* Tags */}
                    {(app.tags ?? []).length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        {app.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">{tag}</span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      {app.url && (
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 block text-center py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
                        >
                          Open ↗
                        </a>
                      )}
                      {adminMode && (
                        <>
                          <button onClick={() => startEdit(app)} className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50">Edit</button>
                          <button onClick={() => del(app.id)} className="px-3 py-2 border border-red-100 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-50">Del</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-xs text-gray-300">Built by Adarsh</footer>
    </div>
  );
}
