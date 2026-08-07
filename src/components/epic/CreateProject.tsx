'use client';

// TEC Epic — "Create a project" (C-125 — Epic OWNS creation). This is the answer to
// Epic's one question, "What are you building?": a signed-in pioneer types a name,
// picks a type, and starts a real project at DRAFT. Identity is derived server-side
// from the session cookie by the BFF — this form never sends an owner (P6). Zone still
// verifies and FundX still funds; Epic only creates + owns the lifecycle. On success
// the new project is handed back to the board so it appears immediately, and the
// pioneer can drive it to completion → Legend (create → earn).
import { useState } from 'react';
import { usePiAuth } from '@yasser172/tec-auth';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { TYPE_META, type Project, type ProjectType } from '@/lib/epic/projects';

const TYPES = Object.keys(TYPE_META) as ProjectType[];

export default function CreateProject({ onCreated }: { onCreated: (p: Project) => void }) {
  const { isAuthenticated } = usePiAuth();
  const [open, setOpen]         = useState(false);
  const [type, setType]         = useState<ProjectType>('STARTUP');
  const [name, setName]         = useState('');
  const [tagline, setTagline]   = useState('');
  const [category, setCategory] = useState('');
  const [phase, setPhase]       = useState<'idle' | 'busy' | 'error'>('idle');
  const [msg, setMsg]           = useState('');

  // Public browsing is allowed (C-125), but creating requires a session. Rather than
  // fail on submit, we only show the "New project" affordance to signed-in pioneers.
  if (!isAuthenticated) return null;

  async function submit() {
    const n = name.trim();
    if (!n) { setPhase('error'); setMsg('Give your project a name.'); return; }
    setPhase('busy'); setMsg('');
    try {
      const res = await fetch('/api/bff/epic/projects', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type, name: n, tagline: tagline.trim(), category: category.trim() }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; project?: Project | null; error?: string };
      if (res.ok && json.project) {
        onCreated(json.project);
        setOpen(false); setName(''); setTagline(''); setCategory(''); setType('STARTUP'); setPhase('idle');
      } else if (res.ok) {
        // e2e / stub path — created but no echo; reset without touching the board.
        setOpen(false); setName(''); setTagline(''); setCategory(''); setPhase('idle');
      } else {
        setPhase('error'); setMsg(json.error ?? 'Could not create the project.');
      }
    } catch {
      setPhase('error'); setMsg('Network error. Please try again.');
    }
  }

  const field: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', background: TEC_COLORS.bg, color: '#e7e7ea',
    border: '1px solid #ffffff22', borderRadius: 10, padding: '10px 12px', fontSize: 14, marginTop: 8,
  };
  const label: React.CSSProperties = { fontSize: 12, opacity: 0.7, marginTop: 12, display: 'block' };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          background: TEC_COLORS.goldDark, color: '#0a0800', border: 'none', borderRadius: 10,
          padding: '10px 18px', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', marginTop: 14,
        }}
      >
        + Start a project
      </button>
    );
  }

  return (
    <div style={{ marginTop: 14, padding: 18, background: TEC_COLORS.surface, borderRadius: 14, border: `1px solid ${TEC_COLORS.gold}33` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ color: TEC_COLORS.gold, fontSize: 15 }}>Start a project</strong>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#e7e7ea', opacity: 0.6, cursor: 'pointer', fontSize: 18, lineHeight: 1 }} aria-label="Close">×</button>
      </div>
      <p style={{ fontSize: 12.5, opacity: 0.65, margin: '4px 0 0', lineHeight: 1.5 }}>
        It starts as a <strong>Draft</strong>. Verification (Zone) and funding (FundX) come later — Epic
        just gets it built.
      </p>

      <label style={label}>Type</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {TYPES.map((tp) => {
          const active = tp === type;
          return (
            <button key={tp} onClick={() => setType(tp)} style={{
              background: active ? TEC_COLORS.gold : 'transparent',
              color: active ? '#0a0800' : '#e7e7ea',
              border: `1px solid ${active ? TEC_COLORS.gold : '#ffffff22'}`,
              borderRadius: 20, padding: '5px 11px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            }}>
              {TYPE_META[tp].icon} {TYPE_META[tp].label}
            </button>
          );
        })}
      </div>

      <label style={label} htmlFor="epic-name">Name</label>
      <input id="epic-name" style={field} value={name} maxLength={80}
        onChange={(e) => setName(e.target.value)} placeholder="e.g. Pi Makers Hub" />

      <label style={label} htmlFor="epic-tagline">Tagline <span style={{ opacity: 0.5 }}>(optional)</span></label>
      <input id="epic-tagline" style={field} value={tagline} maxLength={160}
        onChange={(e) => setTagline(e.target.value)} placeholder="One line on what you're building" />

      <label style={label} htmlFor="epic-category">Category <span style={{ opacity: 0.5 }}>(optional)</span></label>
      <input id="epic-category" style={field} value={category} maxLength={40}
        onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Community, Commerce, Education" />

      {phase === 'error' && <div style={{ marginTop: 12, fontSize: 12.5, color: TEC_COLORS.error }}>{msg}</div>}

      <button onClick={submit} disabled={phase === 'busy'} style={{
        marginTop: 16, width: '100%',
        background: phase === 'busy' ? '#ffffff22' : TEC_COLORS.goldDark,
        color: phase === 'busy' ? '#e7e7ea' : '#0a0800',
        border: 'none', borderRadius: 10, padding: '11px 18px', fontWeight: 800, fontSize: 14,
        cursor: phase === 'busy' ? 'default' : 'pointer',
      }}>
        {phase === 'busy' ? 'Creating…' : 'Create project'}
      </button>
    </div>
  );
}
