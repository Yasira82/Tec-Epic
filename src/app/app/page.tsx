'use client';

// TEC Epic — Creation home (C-125), read-only V1.
// A project board — where new economic initiatives are born. Epic OWNS creation
// + lifecycle; verification (Zone), funding (FundX), reputation (Legend) are
// presented from their owning systems. Epic→Zone→activity→Legend.
import Link from 'next/link';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { PROJECTS, TYPE_META, STATUS_META } from '@/lib/epic/projects';
import EpicPro from './components/EpicPro';

export default function EpicHome() {
  return (
    <main style={{ minHeight: '100vh', background: TEC_COLORS.bg, color: '#e7e7ea', padding: '32px 22px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <header style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 34 }}>🚀</div>
          <h1 style={{ color: TEC_COLORS.gold, margin: '4px 0 2px', fontSize: 26 }}>TEC Epic</h1>
          <p style={{ opacity: 0.7, margin: 0, fontSize: 14 }}>
            Creation Runtime — where the Pi economy builds new things. What are you building?
          </p>
        </header>

        {/* Pipeline explainer */}
        <div style={{ marginTop: 20, padding: '12px 16px', background: TEC_COLORS.surface, borderRadius: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 13 }}>
          {['Epic · Create', 'Zone · Verify', 'Activity · Execute', 'Legend · Earn'].map((s, i, a) => (
            <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: TEC_COLORS.gold }}>{s}</span>
              {i < a.length - 1 && <span style={{ opacity: 0.4 }}>→</span>}
            </span>
          ))}
        </div>

        {/* Project board */}
        <h2 style={{ color: TEC_COLORS.gold, fontSize: 16, marginTop: 28, marginBottom: 12 }}>Projects</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
          {PROJECTS.map((p) => {
            const t = TYPE_META[p.type]; const s = STATUS_META[p.status];
            const done = p.milestones.filter((m) => m.done).length;
            return (
              <Link key={p.id} href={`/project/${p.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ padding: 16, background: TEC_COLORS.surface, borderRadius: 12, border: '1px solid #ffffff10', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 20 }}>{t.icon}</span>
                    <span style={{ fontSize: 11, color: s.tone, border: `1px solid ${s.tone}55`, borderRadius: 20, padding: '2px 8px' }}>{s.label}</span>
                  </div>
                  <div style={{ color: '#e7e7ea', fontWeight: 700, marginTop: 10 }}>{p.name}</div>
                  <div style={{ opacity: 0.65, fontSize: 12.5, marginTop: 6, lineHeight: 1.5 }}>{p.tagline}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, opacity: 0.7 }}>
                    <span>{t.label} · {p.category}</span>
                    <span>{p.zoneVerified ? '✓ Zone' : '—'} · 👥 {p.team}</span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, opacity: 0.6 }}>Milestones {done}/{p.milestones.length}{p.fundedPct != null ? ` · Funded ${p.fundedPct}%` : ''}</div>
                </div>
              </Link>
            );
          })}
        </div>

        <p style={{ opacity: 0.55, fontSize: 12, marginTop: 20, lineHeight: 1.6, borderLeft: `2px solid ${TEC_COLORS.gold}55`, paddingLeft: 12 }}>
          <strong>Boundary (C-125).</strong> Epic owns project creation + lifecycle. It never verifies
          (Zone), moves capital (FundX), records reputation (Legend), or processes transactions
          (Commerce/payment-service) — it coordinates them by ID. This preview is a read-only sample.
        </p>

        {/* Epic Pro */}
        <h2 style={{ color: TEC_COLORS.gold, fontSize: 16, marginTop: 32, marginBottom: 12 }}>Upgrade</h2>
        <EpicPro />
      </div>
    </main>
  );
}
