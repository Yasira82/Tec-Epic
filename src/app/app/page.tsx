'use client';

// TEC Epic — Creation home (C-125), read-only V1.
// A project board — where new economic initiatives are born. Epic OWNS creation
// + lifecycle; verification (Zone), funding (FundX), reputation (Legend) are
// presented from their owning systems. Epic→Zone→activity→Legend. App shell:
// Home / Projects / Pro / Settings bottom nav.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { useTranslation } from '@/lib/i18n';
import { TYPE_META, STATUS_META, type Project } from '@/lib/epic/projects';
import EpicPro from './components/EpicPro';
import EpicInsights from './components/EpicInsights';
import CreateProject from '@/components/epic/CreateProject';
import { BottomNav, type EpicTab } from './components/BottomNav';
import { SettingsView } from './components/SettingsView';

export default function EpicHome() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<EpicTab>('home');

  // Real data end-to-end (C-135 §4): the caller's OWN projects (identity from the
  // session cookie, P6) or an honest empty state — never a fabricated sample.
  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  useEffect(() => {
    let alive = true;
    fetch('/api/bff/epic/projects', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive) return;
        if (d && d.source === 'live' && Array.isArray(d.projects)) {
          setProjects(d.projects);
          setStatus('ready');
        } else {
          setStatus('unavailable');
        }
      })
      .catch(() => { if (alive) setStatus('unavailable'); });
    return () => { alive = false; };
  }, []);

  // A newly created project (owner = the session) appears immediately at the top.
  const handleCreated = (p: Project) => {
    setProjects((prev) => [p, ...prev.filter((x) => x.id !== p.id)]);
    setStatus('ready');
  };

  const headerTitle =
    tab === 'projects' ? t.epic.nav.projects
    : tab === 'pro' ? t.epic.nav.pro
    : tab === 'settings' ? t.epic.nav.settings
    : t.epic.brand;

  return (
    <main style={{ minHeight: '100vh', background: TEC_COLORS.bg, color: '#e7e7ea', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 22px calc(96px + env(safe-area-inset-bottom))' }}>
        <header style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 34 }}>🚀</div>
          <h1 style={{ color: TEC_COLORS.gold, margin: '4px 0 2px', fontSize: 26 }}>{headerTitle}</h1>
          {tab === 'home' && <p style={{ opacity: 0.7, margin: 0, fontSize: 14 }}>{t.epic.tagline}</p>}
        </header>

        {tab === 'home' && (
          <>
            {/* Pipeline explainer */}
            <div style={{ marginTop: 20, padding: '12px 16px', background: TEC_COLORS.surface, borderRadius: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 13 }}>
              {['Epic · Create', 'Zone · Verify', 'Activity · Execute', 'Legend · Earn'].map((sname, i, a) => (
                <span key={sname} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: TEC_COLORS.gold }}>{sname}</span>
                  {i < a.length - 1 && <span style={{ opacity: 0.4 }}>→</span>}
                </span>
              ))}
            </div>

            <p style={{ opacity: 0.55, fontSize: 12, marginTop: 20, lineHeight: 1.6, borderLeft: `2px solid ${TEC_COLORS.gold}55`, paddingLeft: 12 }}>
              <strong>How it works.</strong> Epic is where you create and grow your project.
              Verification, funding, reputation, and payments are handled by their
              dedicated apps — Epic brings them together in one place.
            </p>

            {/* Public discovery — Epic reaches the whole Pi community */}
            <div style={{ marginTop: 20 }}>
              <Link href="/discover" style={{ fontSize: 13, color: TEC_COLORS.gold, textDecoration: 'none', border: `1px solid ${TEC_COLORS.gold}55`, borderRadius: 10, padding: '9px 16px', display: 'inline-block' }}>
                {t.epic.discover}
              </Link>
            </div>
          </>
        )}

        {tab === 'projects' && (
          <>
            <h2 style={{ color: TEC_COLORS.gold, fontSize: 16, marginTop: 12, marginBottom: 4 }}>{t.epic.projects}</h2>

            {/* Create — the answer to "What are you building?" (signed-in only, C-125). */}
            <CreateProject onCreated={handleCreated} />

            <div style={{ height: 12 }} />

            {status === 'loading' && (
              <div style={{ padding: 30, textAlign: 'center', opacity: 0.6, fontSize: 14 }}>Loading your projects…</div>
            )}
            {status === 'unavailable' && (
              <div style={{ padding: '36px 24px', background: TEC_COLORS.surface, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 26 }}>🚀</div>
                <div style={{ color: '#e7e7ea', fontWeight: 800, marginTop: 8 }}>No projects yet</div>
                <p style={{ opacity: 0.65, fontSize: 13, lineHeight: 1.6, maxWidth: 420, margin: '8px auto 0' }}>
                  Sign in with Pi to see the projects you&apos;re building. Create one to start the
                  Epic → Zone → activity → Legend journey — it appears here once you do.
                </p>
              </div>
            )}
            {status === 'ready' && projects.length === 0 && (
              <div style={{ padding: '36px 24px', background: TEC_COLORS.surface, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 26 }}>🚀</div>
                <div style={{ color: '#e7e7ea', fontWeight: 800, marginTop: 8 }}>Nothing built yet</div>
                <p style={{ opacity: 0.65, fontSize: 13, lineHeight: 1.6, maxWidth: 420, margin: '8px auto 0' }}>
                  You haven&apos;t created a project yet. Start one to begin the Epic → Zone → activity → Legend journey.
                </p>
              </div>
            )}

            {status === 'ready' && projects.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
                {projects.map((p) => {
                  const tm = TYPE_META[p.type]; const st = STATUS_META[p.status];
                  const done = p.milestones.filter((m) => m.done).length;
                  return (
                    <Link key={p.id} href={`/project/${p.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ padding: 16, background: TEC_COLORS.surface, borderRadius: 12, border: '1px solid #ffffff10', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 20 }}>{tm.icon}</span>
                          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {p.featured && <span style={{ fontSize: 10, color: TEC_COLORS.gold, border: `1px solid ${TEC_COLORS.gold}66`, borderRadius: 20, padding: '2px 7px' }}>⭐ Featured</span>}
                            <span style={{ fontSize: 11, color: st.tone, border: `1px solid ${st.tone}55`, borderRadius: 20, padding: '2px 8px' }}>{st.label}</span>
                          </span>
                        </div>
                        <div style={{ color: '#e7e7ea', fontWeight: 700, marginTop: 10 }}>{p.name}</div>
                        <div style={{ opacity: 0.65, fontSize: 12.5, marginTop: 6, lineHeight: 1.5 }}>{p.tagline}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, opacity: 0.7 }}>
                          <span>{tm.label} · {p.category}</span>
                          <span>{p.zoneVerified ? '✓ Zone' : '—'} · 👥 {p.team}</span>
                        </div>
                        <div style={{ marginTop: 8, fontSize: 11, opacity: 0.6 }}>Milestones {done}/{p.milestones.length}{p.fundedPct != null ? ` · Funded ${p.fundedPct}%` : ''}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Portfolio Insights — Epic Pro founder dashboard (your own projects) */}
            <EpicInsights />
          </>
        )}

        {tab === 'pro' && (
          <>
            <h2 style={{ color: TEC_COLORS.gold, fontSize: 16, marginTop: 12, marginBottom: 12 }}>{t.epic.upgrade}</h2>
            {/* Epic Pro — real Pi U2A payment (subscription). */}
            <EpicPro />
          </>
        )}

        {tab === 'settings' && <SettingsView />}
      </div>

      <BottomNav active={tab} onSelect={setTab} />
    </main>
  );
}
