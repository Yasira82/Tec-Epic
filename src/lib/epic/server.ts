import {
  PROJECTS, getProject,
  type Project, type ProjectType, type ProjectStatus, type Milestone,
} from './projects';

// Server-only Epic backend access (C-125). Calls the real Epic read-layer
// (identity-service) via the gateway with the inter-service key, and maps the
// backend rows to the frontend shape. Everything degrades to the curated sample so
// the board is never blank / never 500s. NEW-A: the gateway URL is server-only
// (API_GATEWAY_URL) — never shipped to the client.
const GW = process.env.API_GATEWAY_URL ?? '';

const gwHeaders = () => ({
  'Content-Type': 'application/json',
  'x-request-id': crypto.randomUUID(),
  ...(process.env.INTERNAL_SECRET && { 'x-internal-key': process.env.INTERNAL_SECRET }),
});

// backend (epic_projects) → frontend Project. zone_verified + funding are PRESENTED,
// never derived here (Zone verifies, FundX funds — C-125).
export function projectFromBackend(p: Record<string, unknown>): Project {
  const ms = Array.isArray(p.milestones) ? (p.milestones as Record<string, unknown>[]) : [];
  return {
    id:           String(p.slug ?? ''),
    type:         String(p.type ?? '') as ProjectType,
    name:         String(p.name ?? ''),
    tagline:      String(p.tagline ?? ''),
    category:     String(p.category ?? ''),
    team:         Number(p.team ?? 1),
    status:       String(p.status ?? 'DRAFT') as ProjectStatus,
    zoneVerified: Boolean(p.zone_verified),
    fundingGoal:  p.funding_goal == null ? undefined : Number(p.funding_goal),
    fundedPct:    p.funded_pct == null ? undefined : Number(p.funded_pct),
    milestones:   ms.map((m): Milestone => ({ title: String(m.title ?? ''), done: Boolean(m.done) })),
  };
}

export interface ResolvedProjects { projects: Project[]; source: 'live' | 'sample'; }

// The caller's OWN projects — live backend first, curated sample as fallback.
// `owner` is derived from the session by the BFF (never a client param, P6).
export async function resolveOwnProjects(owner: string | null): Promise<ResolvedProjects> {
  if (GW && owner) {
    try {
      const res = await fetch(`${GW}/api/identity/epic/projects/${encodeURIComponent(owner)}`, {
        headers: gwHeaders(), cache: 'no-store',
      });
      if (res.ok) {
        const rows = (await res.json().catch(() => ({})))?.data?.projects;
        if (Array.isArray(rows)) return { projects: rows.map((p) => projectFromBackend(p as Record<string, unknown>)), source: 'live' };
      }
    } catch { /* fall through to the curated sample */ }
  }
  return { projects: PROJECTS, source: 'sample' };
}

export interface ResolvedProject { project: Project | null; source: 'live' | 'sample'; }

// One project by id — live backend first, sample fallback. A live 404 is
// authoritative (project: null, source: 'live').
export async function resolveProject(id: string): Promise<ResolvedProject> {
  if (GW) {
    try {
      const res = await fetch(`${GW}/api/identity/epic/project/${encodeURIComponent(id)}`, {
        headers: gwHeaders(), cache: 'no-store',
      });
      if (res.ok) {
        const p = (await res.json().catch(() => ({})))?.data?.project;
        if (p) return { project: projectFromBackend(p as Record<string, unknown>), source: 'live' };
      }
      if (res.status === 404) return { project: null, source: 'live' };
    } catch { /* fall through to the curated sample */ }
  }
  return { project: getProject(id), source: 'sample' };
}
