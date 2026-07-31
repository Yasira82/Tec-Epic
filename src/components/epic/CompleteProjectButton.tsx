'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TEC_COLORS } from '@yasser172/tec-ui';

// TEC Epic — "Complete project" trigger (value chain → Legend, C-125). Epic is the
// START of the reputation chain: completing a project is a FACT the backend records
// and emits (epic.project.completed.v1) so Legend records the achievement (create →
// earn). Identity is derived server-side from the session cookie by the BFF — this
// button only sends the slug (P6). Honest states: 401 → sign in · 403 → not yours ·
// 409 → already complete · 503 → backend unavailable. On success the page refreshes
// so the lifecycle re-renders at LEGEND from live data.
type Phase = 'idle' | 'busy' | 'done' | 'error';

export default function CompleteProjectButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [msg, setMsg] = useState('');

  async function onClick() {
    setPhase('busy');
    setMsg('');
    try {
      const res = await fetch('/api/bff/epic/complete', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ slug }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && json.ok) {
        setPhase('done');
        setMsg('Completed — recorded in Legend.');
        router.refresh();
      } else {
        setPhase('error');
        setMsg(json.error ?? 'Could not complete the project.');
      }
    } catch {
      setPhase('error');
      setMsg('Network error. Please try again.');
    }
  }

  if (phase === 'done') {
    return (
      <div style={{ marginTop: 20, fontSize: 13, color: TEC_COLORS.success }}>
        ✅ {msg}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 20 }}>
      <button
        onClick={onClick}
        disabled={phase === 'busy'}
        style={{
          background: phase === 'busy' ? '#ffffff22' : TEC_COLORS.goldDark,
          color: phase === 'busy' ? '#e7e7ea' : '#0a0800',
          border: 'none', borderRadius: 10, padding: '10px 18px',
          fontWeight: 800, fontSize: 13.5,
          cursor: phase === 'busy' ? 'default' : 'pointer',
        }}
      >
        {phase === 'busy' ? 'Completing…' : 'Mark project complete → Legend'}
      </button>
      {phase === 'error' && (
        <div style={{ marginTop: 8, fontSize: 12.5, color: TEC_COLORS.error }}>{msg}</div>
      )}
      <p style={{ marginTop: 8, fontSize: 11.5, opacity: 0.55, lineHeight: 1.5 }}>
        Completing graduates this project to <strong>Legend</strong> and records the
        achievement on your reputation. Only the project owner can complete it.
      </p>
    </div>
  );
}
