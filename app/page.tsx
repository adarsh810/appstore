'use client';

import { useEffect, useState } from 'react';
import type { App } from '@/lib/types';

const RATING_CONFIG = {
  great: { label: 'Great', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  good: { label: 'Good', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  bad: { label: 'Bad', bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-400' },
};

export default function StorePage() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/apps')
      .then((r) => r.json())
      .then((data) => { setApps(data); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-extrabold tracking-tight">App Store</h1>
          <p className="text-gray-500 mt-1 text-sm">Apps built by Adarsh — rated honestly.</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {loading && (
          <div className="text-center text-gray-400 py-20 text-sm">Loading apps…</div>
        )}

        {!loading && apps.length === 0 && (
          <div className="text-center text-gray-400 py-20 text-sm">No apps yet.</div>
        )}

        {!loading && apps.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => {
              const rating = app.rating ? RATING_CONFIG[app.rating] : null;
              return (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  {app.screenshot_url ? (
                    <img
                      src={app.screenshot_url}
                      alt={app.name}
                      className="w-full h-44 object-cover border-b border-gray-100"
                    />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl border-b border-gray-100">
                      📦
                    </div>
                  )}

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h2 className="font-bold text-base leading-snug">{app.name}</h2>
                      {rating && (
                        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${rating.bg} ${rating.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${rating.dot}`} />
                          {rating.label}
                        </span>
                      )}
                    </div>

                    {app.description && (
                      <p className="text-sm text-gray-500 leading-relaxed flex-1">{app.description}</p>
                    )}

                    {app.url && (
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 block text-center w-full py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
                      >
                        Open app ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-xs text-gray-300">
        Built by Adarsh ·{' '}
        <a href="/admin" className="hover:text-gray-400">Admin</a>
      </footer>
    </div>
  );
}
