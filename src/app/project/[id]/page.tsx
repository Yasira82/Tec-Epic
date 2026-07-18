// TEC Epic — project detail (C-125), read-only, statically generated.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { PROJECTS, TYPE_META, STATUS_META, STATUS_ORDER } from '@/lib/epic/projects';
import { resolveProject } from '@/lib/epic/server';

// Pre-render the curated sample slugs; allow live-only backend projects to render on
// demand (the Epic read-layer is the project board of record — C-125).
export function generateStaticParams() {
  return PROJECTS.map((p) => ({ id: p.id }));
}
export const dynamicParams = true;

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Resolve from the live Epic read-layer; fall back to the curated sample so the
  // page never 500s. A live 404 is authoritative → notFound().
  const { project: p } = await resolveProject(id);
  if (!p) notFound();

  const t = TYPE_META[p.type];
  const s = STATUS_META[p.status];
  const stageIdx = STATUS_ORDER.indexOf(p.status);

  return (
    <main style={{ minHeight: '100vh', background: TEC_COLORS.bg, color: '#e7e7ea', padding: '32px 22px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link href="/app" style={{ color: TEC_COLORS.gold, fontSize: 13, textDecoration: 'none' }}>← Back</Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <span style={{ fontSize: 30 }}>{t.icon}</span>
          <h1 style={{ color: TEC_COLORS.gold, margin: 0, fontSize: 24 }}>{p.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: s.tone, border: `1px solid ${s.tone}55`, borderRadius: 20, padding: '3px 10px' }}>{s.label}</span>
          <span style={{ fontSize: 12, opacity: 0.7, border: '1px solid #ffffff22', borderRadius: 20, padding: '3px 10px' }}>{t.label} · {p.category}</span>
          <span style={{ fontSize: 12, opacity: 0.7, border: '1px solid #ffffff22', borderRadius: 20, padding: '3px 10px' }}>{p.zoneVerified ? '✓ Zone verified' : 'Unverified'}</span>
          <span style={{ fontSize: 12, opacity: 0.7, border: '1px solid #ffffff22', borderRadius: 20, padding: '3px 10px' }}>👥 {p.team}</span>
        </div>

        <p style={{ marginTop: 16, lineHeight: 1.6, opacity: 0.9 }}>{p.tagline}</p>

        {/* Lifecycle pipeline */}
        <h2 style={{ color: TEC_COLORS.gold, fontSize: 15, marginTop: 24 }}>Lifecycle</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {STATUS_ORDER.map((st, i) => {
            const reached = i <= stageIdx;
            const meta = STATUS_META[st];
            return (
              <span key={st} style={{
                fontSize: 11.5, padding: '4px 10px', borderRadius: 20,
                color: reached ? '#0a0800' : meta.tone,
                background: reached ? meta.tone : 'transparent',
                border: `1px solid ${meta.tone}${reached ? '' : '55'}`,
              }}>{meta.label}</span>
            );
          })}
        </div>

        {/* Funding (presented from FundX) */}
        {p.fundingGoal != null && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ opacity: 0.8 }}>Funding goal (via FundX) · π {p.fundingGoal.toLocaleString()}</span>
              <span style={{ color: TEC_COLORS.gold }}>{p.fundedPct ?? 0}%</span>
            </div>
            <div style={{ height: 8, background: '#ffffff14', borderRadius: 8 }}>
              <div style={{ height: 8, width: `${p.fundedPct ?? 0}%`, background: TEC_COLORS.goldDark, borderRadius: 8 }} />
            </div>
          </div>
        )}

        {/* Milestones */}
        <h2 style={{ color: TEC_COLORS.gold, fontSize: 15, marginTop: 24 }}>Milestones</h2>
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
          {p.milestones.map((m, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 0', opacity: m.done ? 1 : 0.6 }}>
              <span>{m.done ? '✅' : '⬜'}</span>
              <span style={{ textDecoration: m.done ? 'line-through' : 'none' }}>{m.title}</span>
            </li>
          ))}
        </ul>

        <p style={{ marginTop: 20, fontSize: 12, opacity: 0.55, lineHeight: 1.6, borderLeft: `2px solid ${TEC_COLORS.gold}55`, paddingLeft: 12 }}>
          Verification is minted by Zone, funding executed by FundX, and completion recorded in Legend —
          Epic presents them by ID and never re-derives them (C-125). Read-only sample.
        </p>
      </div>
    </main>
  );
}
