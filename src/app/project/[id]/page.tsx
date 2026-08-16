// TEC Epic — project detail (C-125), read-only. Rendered dynamically from the live
// Epic read-layer — real data end-to-end (C-135 §4): a live 404 is "not found"; an
// unreachable backend is an honest "couldn't load". Never a fabricated sample.
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { TYPE_META, STATUS_META, STATUS_ORDER } from '@/lib/epic/projects';
import { resolveProject, zoneStatusForName } from '@/lib/epic/server';
import CompleteProjectButton from '@/components/epic/CompleteProjectButton';
import MilestonesEditor from '@/components/epic/MilestonesEditor';
import RequestZoneVerification from '@/components/epic/RequestZoneVerification';

// Reliable owner check: the session cookies are read SERVER-SIDE (unlike the client-side
// auth flag, which is unreliable in Pi Browser — the C-123 saga). Only the owner of a
// non-terminal project gets the interactive milestone editor; everyone else (public
// viewers) sees the read-only list. The JWT is forwarded to Zone for verification.
async function session(): Promise<{ username: string | null; token: string | null }> {
  try {
    const jar = await cookies();
    const token = jar.get('tec_access_token')?.value ?? null;
    const raw = jar.get('tec_user')?.value ?? '';
    if (!raw) return { username: null, token };
    let u: Record<string, unknown>;
    try { u = JSON.parse(raw); } catch { u = JSON.parse(decodeURIComponent(raw)); }
    const name = (u.piUsername ?? u.username) as string | undefined;
    return { username: name && name.trim() ? name : null, token };
  } catch { return { username: null, token: null }; }
}

export const dynamic = 'force-dynamic';

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { project: p, source } = await resolveProject(id);

  if (!p) {
    if (source === 'live') notFound();
    return (
      <main style={{ minHeight: '100vh', background: TEC_COLORS.bg, color: '#e7e7ea', padding: '32px 22px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <Link href="/app" style={{ color: TEC_COLORS.gold, fontSize: 13, textDecoration: 'none' }}>← Back</Link>
          <div style={{ marginTop: 40, padding: '40px 24px', background: TEC_COLORS.surface, borderRadius: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 28 }}>🚀</div>
            <div style={{ color: '#e7e7ea', fontWeight: 800, marginTop: 8 }}>Couldn&apos;t load this project</div>
            <p style={{ opacity: 0.65, fontSize: 13.5, marginTop: 6 }}>The Epic read-layer is unavailable right now. Please try again.</p>
          </div>
        </div>
      </main>
    );
  }

  const t = TYPE_META[p.type];
  const s = STATUS_META[p.status];
  const stageIdx = STATUS_ORDER.indexOf(p.status);
  const { username: viewer, token } = await session();
  const isOwner = !!viewer && !!p.owner && viewer === p.owner;
  const canEditMilestones = isOwner && p.status !== 'LEGEND';
  // Live Zone status for the owner (C-121 create → verify). Epic presents Zone's
  // verdict; it never mints it (C-125). null = not submitted yet.
  const zone = isOwner ? await zoneStatusForName(token, p.name) : null;

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

        {/* Verification (Zone) — owner-only. Epic asks Zone; Zone decides (C-121 /
            C-125). Live status from Zone: verified · pending · request. */}
        {isOwner && (
          <div style={{ marginTop: 24 }}>
            <h2 style={{ color: TEC_COLORS.gold, fontSize: 15, margin: 0 }}>Verification</h2>
            {zone?.status === 'VERIFIED' ? (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: TEC_COLORS.success }}>
                <span>🛡️</span><span>Zone Verified — confirmed by a human reviewer.</span>
              </div>
            ) : zone?.status === 'PENDING' ? (
              <div style={{ marginTop: 10, fontSize: 13, opacity: 0.8, lineHeight: 1.5 }}>
                ⏳ Verification pending Zone review — a reviewer will confirm the evidence. “Zone Verified” is earned, never bought.
              </div>
            ) : (
              <>
                {zone?.status === 'REVOKED' && (
                  <div style={{ marginTop: 10, fontSize: 12.5, color: TEC_COLORS.error }}>
                    A previous Zone request was revoked. You can submit again below.
                  </div>
                )}
                <RequestZoneVerification slug={p.id} />
              </>
            )}
          </div>
        )}

        {/* Milestones — interactive for the owner (add + check off), read-only for
            everyone else. Epic owns project structure (C-125). */}
        <h2 style={{ color: TEC_COLORS.gold, fontSize: 15, marginTop: 24 }}>Milestones</h2>
        <div style={{ marginTop: 8 }}>
          {canEditMilestones ? (
            <MilestonesEditor slug={p.id} initial={p.milestones} />
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {p.milestones.length === 0 && (
                <li style={{ opacity: 0.6, fontSize: 13, padding: '4px 0' }}>No milestones yet.</li>
              )}
              {p.milestones.map((m, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 0', opacity: m.done ? 1 : 0.6 }}>
                  <span>{m.done ? '✅' : '⬜'}</span>
                  <span style={{ textDecoration: m.done ? 'line-through' : 'none' }}>{m.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Value chain (C-125): completing graduates the project to Legend. Shown for
            the owner's non-terminal projects; the backend enforces owner-scope. */}
        {isOwner && p.status !== 'LEGEND' && <CompleteProjectButton slug={p.id} />}

        <p style={{ marginTop: 20, fontSize: 12, opacity: 0.55, lineHeight: 1.6, borderLeft: `2px solid ${TEC_COLORS.gold}55`, paddingLeft: 12 }}>
          Verification, funding, and completed milestones are handled by their dedicated
          apps and shown here together.
        </p>
      </div>
    </main>
  );
}
