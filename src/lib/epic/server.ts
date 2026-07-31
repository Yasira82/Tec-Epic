import {
  type Project, type ProjectType, type ProjectStatus, type Milestone,
} from './projects';

// Server-only Epic backend access (C-125). Calls the real Epic read-layer
// (identity-service) via the gateway with the inter-service key, and maps the
// backend rows to the frontend shape. Real data end-to-end (C-135 §4): an
// unreachable backend / no session resolves to `unavailable` (no projects) —
// never a fabricated sample. NEW-A: the gateway URL is server-only
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

export interface ResolvedProjects { projects: Project[]; source: 'live' | 'unavailable'; }

// The caller's OWN projects — live backend only. `owner` is derived from the session
// by the BFF (never a client param, P6). No session or an unreachable backend
// resolves to (projects: [], source: 'unavailable') so the page shows an honest
// empty state — never a fabricated sample (C-135 §4).
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
    } catch { /* unreachable → unavailable below */ }
  }
  return { projects: [], source: 'unavailable' };
}

export interface CompleteResult {
  ok: boolean;
  status: number;
  project?: Project;
  error?: string;
}

// Complete the caller's OWN project (value chain → Legend, C-125). `owner` is derived
// from the session by the BFF (never a client field, P6); the backend enforces
// owner-scope + terminal-state. A completed project graduates to LEGEND and the
// backend emits epic.project.completed.v1 so Legend records the achievement (create →
// earn). Returns the backend status so the UI can show an honest message
// (401 no session · 403 not yours · 409 already complete · 503 unreachable).
export async function completeProject(owner: string | null, slug: string): Promise<CompleteResult> {
  if (!owner) return { ok: false, status: 401, error: 'Sign in to complete your project.' };
  if (!GW)    return { ok: false, status: 503, error: 'The Epic backend is unavailable right now.' };
  try {
    const res = await fetch(`${GW}/api/identity/epic/project/${encodeURIComponent(slug)}/complete`, {
      method:  'POST',
      headers: gwHeaders(),
      body:    JSON.stringify({ owner }),
      cache:   'no-store',
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.ok) {
      const p = (json?.data as Record<string, unknown> | undefined)?.project;
      return { ok: true, status: 200, project: p ? projectFromBackend(p as Record<string, unknown>) : undefined };
    }
    // Map backend errors to a caller-safe message (never leak internal detail).
    const msg = res.status === 403 ? 'This is not your project.'
      : res.status === 404 ? 'Project not found.'
      : res.status === 400 || res.status === 409 ? 'This project is already completed.'
      : 'Could not complete the project. Please try again.';
    return { ok: false, status: res.status, error: msg };
  } catch {
    return { ok: false, status: 503, error: 'The Epic backend is unavailable right now.' };
  }
}

export interface ResolvedProject { project: Project | null; source: 'live' | 'unavailable'; }

// One project by id — live backend only. A live 404 is authoritative (project: null,
// source: 'live'); an unreachable backend resolves to (project: null, source:
// 'unavailable'). Never a fabricated sample.
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
    } catch { /* unreachable → unavailable below */ }
  }
  return { project: null, source: 'unavailable' };
}
