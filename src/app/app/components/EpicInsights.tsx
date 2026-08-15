'use client';

// TEC Epic (C-125) — Portfolio Insights (Epic Pro). A real, standalone Pro service (not
// just reach): a founder dashboard aggregating the caller's OWN projects — value with
// zero population because it's your own creation record. The aggregate is gated
// server-side behind live Pro (P5); a non-Pro sees an honest teaser. Own-scope (P6).
import { useEffect, useState } from 'react';
import { TEC_COLORS } from '@yasser172/tec-ui';

interface Insights {
  total: number;
  byStatus: Record<string, number>;
  completed: number;
  completionRate: number;
  legendOutcomes: number;
  zoneVerified: number;
  milestones: { total: number; done: number; pct: number };
  funding: { goalSum: number; avgFundedPct: number };
}

const box = { padding: 16, background: TEC_COLORS.surface, borderRadius: 12, border: `1px solid ${TEC_COLORS.gold}22` } as const;

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ textAlign: 'center', flex: 1, minWidth: 70 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: TEC_COLORS.gold }}>{value}</div>
      <div style={{ fontSize: 10.5, color: '#9aa', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function EpicInsights() {
  const [pro, setPro] = useState<boolean | null>(null);
  const [data, setData] = useState<Insights | null>(null);

  useEffect(() => {
    fetch('/api/bff/epic/insights', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.status === 401 ? null : r.json()))
      .then((j: { pro?: boolean; insights?: Insights } | null) => {
        if (!j) { setPro(false); return; }
        setPro(Boolean(j.pro));
        setData(j.insights ?? null);
      })
      .catch(() => setPro(false));
  }, []);

  if (pro === null) return null;

  return (
    <section style={{ marginTop: 26 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
        <h2 style={{ color: TEC_COLORS.gold, fontSize: 16, margin: 0 }}>📊 Portfolio insights</h2>
        <span style={{ fontSize: 11, color: TEC_COLORS.gold, border: `1px solid ${TEC_COLORS.gold}55`, borderRadius: 999, padding: '1px 8px' }}>PRO</span>
      </div>

      {!pro || !data ? (
        <div style={box}>
          <div style={{ color: '#e7e7ea', fontWeight: 800 }}>🔒 Your founder dashboard</div>
          <p style={{ opacity: 0.7, fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
            Epic Pro turns your projects into a portfolio: completion rate, milestone progress,
            Zone-verified count, Legend outcomes earned, and funding across everything you build —
            your own data. Upgrade below to unlock.
          </p>
        </div>
      ) : data.total === 0 ? (
        <div style={box}>
          <p style={{ opacity: 0.7, fontSize: 13, lineHeight: 1.6 }}>
            No projects yet — create one above and your portfolio dashboard fills in automatically.
          </p>
        </div>
      ) : (
        <div style={{ ...box, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Stat label="Projects" value={data.total} />
            <Stat label="Completed" value={`${data.completionRate}%`} />
            <Stat label="🏆 Legend" value={data.legendOutcomes} />
            <Stat label="✓ Zone" value={data.zoneVerified} />
          </div>

          {/* Milestone progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, opacity: 0.75, marginBottom: 5 }}>
              <span>Milestones</span><span>{data.milestones.done}/{data.milestones.total} · {data.milestones.pct}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: '#ffffff14', overflow: 'hidden' }}>
              <div style={{ width: `${data.milestones.pct}%`, height: '100%', background: `linear-gradient(90deg, ${TEC_COLORS.gold}, ${TEC_COLORS.goldDark})` }} />
            </div>
          </div>

          {/* Lifecycle breakdown */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['DRAFT', 'ACTIVE', 'FUNDED', 'COMPLETED', 'LEGEND'] as const).map((s) => (
              <span key={s} style={{ fontSize: 11, color: '#cbd', border: '1px solid #ffffff1a', borderRadius: 999, padding: '3px 10px' }}>
                {s.charAt(0) + s.slice(1).toLowerCase()} · <strong style={{ color: TEC_COLORS.gold }}>{data.byStatus[s] ?? 0}</strong>
              </span>
            ))}
          </div>

          {data.funding.goalSum > 0 && (
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Funding targets: <strong style={{ color: TEC_COLORS.gold }}>{data.funding.goalSum}π</strong> · avg funded {data.funding.avgFundedPct}%
              <span style={{ opacity: 0.6 }}> (presented from FundX — Epic never moves capital, C-125)</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
