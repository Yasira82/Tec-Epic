'use client';

// TEC Epic — interactive milestones (C-125 — Epic owns project structure). The owner
// of a project adds milestones and checks them off: a self-contained tracker that
// makes the project a living thing you manage. Identity is enforced server-side (the
// BFF derives the owner from the session cookie; the backend re-checks owner-scope +
// terminal-state — P6). This component only sends the slug + milestone data, never an
// owner. Rendered only for the owner of a non-terminal project (the detail page gates).
import { useState } from 'react';
import { TEC_COLORS } from '@yasser172/tec-ui';
import type { Milestone } from '@/lib/epic/projects';

export default function MilestonesEditor({ slug, initial }: { slug: string; initial: Milestone[] }) {
  const [items, setItems] = useState<Milestone[]>(initial);
  const [title, setTitle] = useState('');
  const [busy, setBusy]   = useState(false);
  const [msg, setMsg]     = useState('');

  function applyResult(json: { ok?: boolean; project?: { milestones?: Milestone[] } | null; error?: string }, resOk: boolean) {
    if (resOk && json.ok && json.project?.milestones) {
      setItems(json.project.milestones);
      setMsg('');
      return true;
    }
    setMsg(json.error ?? 'Something went wrong. Please try again.');
    return false;
  }

  async function toggle(index: number, done: boolean) {
    setBusy(true);
    try {
      const res = await fetch('/api/bff/epic/milestone', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, index, done }),
      });
      applyResult(await res.json().catch(() => ({})), res.ok);
    } catch { setMsg('Network error. Please try again.'); }
    setBusy(false);
  }

  async function add() {
    const t = title.trim();
    if (!t) return;
    setBusy(true);
    try {
      const res = await fetch('/api/bff/epic/milestone', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, title: t }),
      });
      if (applyResult(await res.json().catch(() => ({})), res.ok)) setTitle('');
    } catch { setMsg('Network error. Please try again.'); }
    setBusy(false);
  }

  const done = items.filter((m) => m.done).length;

  return (
    <div>
      {items.length > 0 && (
        <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>{done}/{items.length} done</div>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((m, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 0' }}>
            <button
              onClick={() => toggle(i, !m.done)}
              disabled={busy}
              aria-label={m.done ? 'Mark not done' : 'Mark done'}
              style={{
                background: 'none', border: 'none', cursor: busy ? 'default' : 'pointer',
                fontSize: 18, lineHeight: 1, padding: 0,
              }}
            >
              {m.done ? '✅' : '⬜'}
            </button>
            <span style={{ opacity: m.done ? 0.7 : 1, textDecoration: m.done ? 'line-through' : 'none' }}>{m.title}</span>
          </li>
        ))}
      </ul>

      {items.length === 0 && (
        <p style={{ opacity: 0.6, fontSize: 13, margin: '4px 0 10px' }}>
          No milestones yet — add the first step toward completing this project.
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
          maxLength={120}
          placeholder="Add a milestone…"
          aria-label="New milestone"
          style={{
            flex: 1, background: TEC_COLORS.bg, color: '#e7e7ea', border: '1px solid #ffffff22',
            borderRadius: 10, padding: '10px 12px', fontSize: 14,
          }}
        />
        <button
          onClick={add}
          disabled={busy || !title.trim()}
          style={{
            background: busy || !title.trim() ? '#ffffff22' : TEC_COLORS.goldDark,
            color: busy || !title.trim() ? '#e7e7ea' : '#0a0800',
            border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 800, fontSize: 13.5,
            cursor: busy || !title.trim() ? 'default' : 'pointer', whiteSpace: 'nowrap',
          }}
        >
          Add
        </button>
      </div>
      {msg && <div style={{ marginTop: 8, fontSize: 12.5, color: TEC_COLORS.error }}>{msg}</div>}
    </div>
  );
}
