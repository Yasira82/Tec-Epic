'use client';

// TEC Epic — public project discovery (C-125). The whole Pi community browses "what's
// being built on Pi" — no login. Trust-first: Zone-verified projects rank first; ⭐ Featured
// (Epic Pro) lifts a project WITHIN its tier (visibility only, never verification). Real
// data from the public BFF (/api/bff/epic/discover); inline Pi-Browser-safe styling.
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { type Project, TYPE_META, STATUS_META } from '@/lib/epic/projects';

export default function Discover() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus]     = useState<'loading' | 'ready' | 'empty'>('loading');
  const [cat, setCat]           = useState<string>('All');

  useEffect(() => {
    let alive = true;
    fetch('/api/bff/epic/discover', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { projects?: Project[] } | null) => {
        if (!alive) return;
        const list = j?.projects ?? [];
        setProjects(list);
        setStatus(list.length ? 'ready' : 'empty');
      })
      .catch(() => { if (alive) setStatus('empty'); });
    return () => { alive = false; };
  }, []);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(projects.map((p) => p.category).filter(Boolean)))],
    [projects],
  );
  const shown = cat === 'All' ? projects : projects.filter((p) => p.category === cat);

  return (
    <main style={{ minHeight: '100vh', background: TEC_COLORS.bg, color: '#e7e7ea', padding: '36px 22px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 32 }}>🧭</div>
          <h1 style={{ color: TEC_COLORS.gold, margin: '6px 0 4px', fontSize: 26 }}>Discover Pi projects</h1>
          <p style={{ fontSize: 13, color: TEC_COLORS.subtext, margin: 0, lineHeight: 1.5 }}>
            What the Pi community is building on TEC · Epic. Verified projects rank first.
          </p>
        </header>

        {status === 'loading' && <Center>Loading projects…</Center>}
        {status === 'empty'   && <Center>No launched projects to show yet — check back soon.</Center>}

        {status === 'ready' && (
          <>
            {categories.length > 2 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 18 }}>
                {categories.map((c) => (
                  <button key={c} onClick={() => setCat(c)} style={{
                    background: c === cat ? TEC_COLORS.gold : 'transparent',
                    color: c === cat ? '#0a0800' : '#e7e7ea',
                    border: `1px solid ${c === cat ? TEC_COLORS.gold : '#ffffff22'}`,
                    borderRadius: 999, padding: '5px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                  }}>{c}</button>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gap: 12 }}>
              {shown.map((p) => <ProjectCard key={p.id} p={p} />)}
            </div>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <Link href="/app" style={{ fontSize: 13, color: TEC_COLORS.gold, textDecoration: 'none', border: `1px solid ${TEC_COLORS.gold}55`, borderRadius: 10, padding: '9px 18px' }}>
            Building something? Start your project →
          </Link>
        </div>
      </div>
    </main>
  );
}

function ProjectCard({ p }: { p: Project }) {
  const type = TYPE_META[p.type] ?? { label: p.type, icon: '•' };
  const st   = STATUS_META[p.status] ?? { label: p.status, tone: '#8B5CF6' };
  return (
    <Link href={`/project/${encodeURIComponent(p.id)}`} style={{ textDecoration: 'none' }}>
      <div style={{ background: TEC_COLORS.surface, border: '1px solid #ffffff12', borderRadius: 14, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          <span style={{ fontSize: 16 }}>{type.icon}</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{p.name}</span>
          {p.zoneVerified && <Tag tone="#06B6D4">✓ Zone Verified</Tag>}
          {p.featured && <Tag tone={TEC_COLORS.gold}>⭐ Featured</Tag>}
        </div>
        <p style={{ fontSize: 13, color: TEC_COLORS.subtext, margin: '0 0 10px', lineHeight: 1.5 }}>{p.tagline}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11.5, color: TEC_COLORS.subtext }}>
          <span style={{ color: st.tone, fontWeight: 700 }}>{st.label}</span>
          <span>·</span><span>{type.label}</span>
          <span>·</span><span>{p.category}</span>
          <span>·</span><span>👥 {p.team}</span>
          {typeof p.fundedPct === 'number' && (<><span>·</span><span>💠 {p.fundedPct}% funded</span></>)}
        </div>
      </div>
    </Link>
  );
}

function Tag({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 10.5, fontWeight: 800, color: tone, border: `1px solid ${tone}66`, borderRadius: 999, padding: '1px 8px' }}>
      {children}
    </span>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div style={{ background: TEC_COLORS.surface, border: '1px solid #ffffff12', borderRadius: 12, padding: 20, textAlign: 'center', color: TEC_COLORS.subtext, fontSize: 13 }}>{children}</div>;
}
