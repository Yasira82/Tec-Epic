'use client';

// TEC Epic → Zone (C-121 "create → verify"). Epic owns creation; it never mints
// verification (C-125). This asks Zone to verify the project — Zone starts the request
// PENDING and a human reviewer decides (a submitter can never self-verify, C-120 §7).
// Identity is enforced server-side (the BFF forwards the owner's JWT to Zone, P6).
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TEC_COLORS } from '@yasser172/tec-ui';

type Phase = 'idle' | 'busy' | 'done' | 'error';

export default function RequestZoneVerification({ slug }: { slug: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [msg, setMsg]     = useState('');

  async function onClick() {
    setPhase('busy'); setMsg('');
    try {
      const res = await fetch('/api/bff/epic/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && json.ok) {
        setPhase('done');
        setMsg('Submitted to Zone — pending human review. You’ll be verified once a reviewer confirms the evidence.');
        router.refresh();
      } else {
        setPhase('error');
        setMsg(json.error ?? 'Could not reach Zone. Please try again.');
      }
    } catch {
      setPhase('error'); setMsg('Network error. Please try again.');
    }
  }

  if (phase === 'done') {
    return (
      <div style={{ marginTop: 14, fontSize: 13, color: TEC_COLORS.success, lineHeight: 1.5 }}>⏳ {msg}</div>
    );
  }

  return (
    <div style={{ marginTop: 14 }}>
      <button
        onClick={onClick}
        disabled={phase === 'busy'}
        style={{
          background: 'transparent', color: TEC_COLORS.gold,
          border: `1px solid ${TEC_COLORS.gold}66`, borderRadius: 10, padding: '9px 16px',
          fontWeight: 700, fontSize: 13, cursor: phase === 'busy' ? 'default' : 'pointer',
        }}
      >
        {phase === 'busy' ? 'Requesting…' : '🛡️ Request Zone verification'}
      </button>
      {phase === 'error' && (
        <div style={{ marginTop: 8, fontSize: 12.5, color: TEC_COLORS.error }}>{msg}</div>
      )}
      <p style={{ marginTop: 8, fontSize: 11.5, opacity: 0.55, lineHeight: 1.5 }}>
        Epic doesn’t verify — Zone does. Your request starts pending and a human reviewer
        confirms it; “Zone Verified” is earned, never bought.
      </p>
    </div>
  );
}
