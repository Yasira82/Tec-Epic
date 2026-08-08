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
    owner:        p.owner ? String(p.owner) : undefined,
    type:         String(p.type ?? '') as ProjectType,
    name:         String(p.name ?? ''),
    tagline:      String(p.tagline ?? ''),
    category:     String(p.category ?? ''),
    team:         Number(p.team ?? 1),
    status:       String(p.status ?? 'DRAFT') as ProjectStatus,
    zoneVerified: Boolean(p.zone_verified),
    featured:     Boolean(p.featured),
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

// The caller's LIVE Epic-Pro entitlement — read from commerce (the Subscription owner,
// C-47) with the session JWT. Epic never STORES billing (P5); it only reflects it to gate
// the FEATURED benefit. Pro only while the period is live. Any failure → false (fail closed).
export async function resolveProStatus(token: string | null): Promise<boolean> {
  if (!GW || !token) return false;
  try {
    const res = await fetch(`${GW}/api/commerce/subscriptions/status`, {
      headers: { ...gwHeaders(), Authorization: `Bearer ${token}` }, cache: 'no-store',
    });
    if (!res.ok) return false;
    const d = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const s = (d.data ?? d) as Record<string, unknown>;
    const plan = String(s.plan ?? s.tier ?? '').toUpperCase();
    const active  = s.isActive === true || s.active === true || (plan !== '' && plan !== 'FREE');
    const expired = s.isExpired === true;
    const end     = s.current_period_end ?? s.currentPeriodEnd ?? s.expires_at;
    const notExpired = !expired && (!end || new Date(String(end)).getTime() > Date.now());
    return active && notExpired && plan !== '' && plan !== 'FREE';
  } catch { return false; }
}

// Epic Pro — Portfolio Insights: the aggregate of the owner's OWN projects (C-125). A
// genuine standalone dashboard (own data, no population needed). `owner` is the session
// identity resolved by the BFF (P6); the BFF gates this behind live Pro (P5). null on
// unreachable / no session.
export interface PortfolioInsights {
  total: number;
  byStatus: Record<string, number>;
  completed: number;
  completionRate: number;
  legendOutcomes: number;
  zoneVerified: number;
  milestones: { total: number; done: number; pct: number };
  funding: { goalSum: number; avgFundedPct: number };
}
export async function resolveInsights(owner: string | null): Promise<PortfolioInsights | null> {
  if (!GW || !owner) return null;
  try {
    const res = await fetch(`${GW}/api/identity/epic/insights/${encodeURIComponent(owner)}`, { headers: gwHeaders(), cache: 'no-store' });
    if (!res.ok) return null;
    const insights = (await res.json().catch(() => ({})))?.data?.insights;
    return insights ?? null;
  } catch { return null; }
}

// Epic Pro — sync the FEATURED flag on all the owner's projects to match their live Pro
// (visibility only, never verification). `owner` is derived from the session by the BFF
// (P6). Best-effort: a failure never blocks the board read.
export async function setFeaturedForOwner(owner: string | null, on: boolean): Promise<boolean> {
  if (!GW || !owner) return false;
  try {
    const res = await fetch(`${GW}/api/identity/epic/featured`, {
      method: 'PATCH', headers: gwHeaders(), body: JSON.stringify({ owner, featured: on }), cache: 'no-store',
    });
    return res.ok;
  } catch { return false; }
}

// PUBLIC project directory (C-125) — the Pi community browses launched projects. No auth
// (the internal key authorizes the gateway hop). Trust-first + featured order is the
// backend's; an unreachable backend → empty (honest). Optional category filter.
export async function resolveDiscover(category?: string): Promise<Project[]> {
  if (!GW) return [];
  try {
    const q = category && category.trim() ? `?category=${encodeURIComponent(category.trim())}` : '';
    const res = await fetch(`${GW}/api/identity/epic/discover${q}`, { headers: gwHeaders(), cache: 'no-store' });
    if (!res.ok) return [];
    const rows = (await res.json().catch(() => ({})))?.data?.projects;
    return Array.isArray(rows) ? rows.map((p) => projectFromBackend(p as Record<string, unknown>)) : [];
  } catch { return []; }
}

export interface CreateResult {
  ok: boolean;
  status: number;
  project?: Project;
  error?: string;
}

// Create the caller's OWN project (C-125 — Epic owns creation). `owner` is derived
// from the session by the BFF (never a client field, P6); the backend validates the
// type + name and starts the project at DRAFT/unverified/unfunded. Returns the backend
// status so the UI can show an honest message (401 no session · 400 bad input · 503
// unreachable). Zone still verifies and FundX still funds — Epic only owns creation.
export async function createProject(
  owner: string | null,
  input: { type: string; name: string; tagline?: string; category?: string },
): Promise<CreateResult> {
  if (!owner) return { ok: false, status: 401, error: 'Sign in to create a project.' };
  if (!GW)    return { ok: false, status: 503, error: 'The Epic backend is unavailable right now.' };
  try {
    const res = await fetch(`${GW}/api/identity/epic/project`, {
      method:  'POST',
      headers: gwHeaders(),
      body:    JSON.stringify({ owner, ...input }),
      cache:   'no-store',
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.ok) {
      const p = (json?.data as Record<string, unknown> | undefined)?.project;
      return { ok: true, status: 201, project: p ? projectFromBackend(p as Record<string, unknown>) : undefined };
    }
    const msg = res.status === 400
      ? String((json as { message?: string })?.message ?? 'Please check the name and type.')
      : 'Could not create the project. Please try again.';
    return { ok: false, status: res.status, error: msg };
  } catch {
    return { ok: false, status: 503, error: 'The Epic backend is unavailable right now.' };
  }
}

// ── Milestone management (the owner tracks their own project — C-125) ──────────
export interface MilestoneResult {
  ok: boolean;
  status: number;
  project?: Project;
  error?: string;
}

async function milestoneCall(
  owner: string | null, slug: string, method: 'POST' | 'PATCH', body: Record<string, unknown>,
): Promise<MilestoneResult> {
  if (!owner) return { ok: false, status: 401, error: 'Sign in to edit your project.' };
  if (!GW)    return { ok: false, status: 503, error: 'The Epic backend is unavailable right now.' };
  try {
    const res = await fetch(`${GW}/api/identity/epic/project/${encodeURIComponent(slug)}/milestone`, {
      method,
      headers: gwHeaders(),
      body:    JSON.stringify({ owner, ...body }),
      cache:   'no-store',
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.ok) {
      const p = (json?.data as Record<string, unknown> | undefined)?.project;
      return { ok: true, status: 200, project: p ? projectFromBackend(p as Record<string, unknown>) : undefined };
    }
    const msg = res.status === 403 ? 'This is not your project.'
      : res.status === 404 ? 'Project not found.'
      : res.status === 400 ? String((json as { message?: string })?.message ?? 'Please check your input.')
      : 'Could not update the milestone. Please try again.';
    return { ok: false, status: res.status, error: msg };
  } catch {
    return { ok: false, status: 503, error: 'The Epic backend is unavailable right now.' };
  }
}

/** Add a milestone to the caller's OWN project (owner resolved by the BFF — P6). */
export const addMilestone = (owner: string | null, slug: string, title: string) =>
  milestoneCall(owner, slug, 'POST', { title });

/** Toggle a milestone's done state on the caller's OWN project (P6). */
export const setMilestoneDone = (owner: string | null, slug: string, index: number, done: boolean) =>
  milestoneCall(owner, slug, 'PATCH', { index, done });

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

// ── Epic → Zone (C-121 "create → verify") ─────────────────────────────────────
// Epic never mints verification (C-125). To get an Epic project verified, the OWNER
// asks Zone — we call Zone's OWN gateway API (POST /identity/zone/verification) and
// forward the user's JWT so Zone attributes the request to the verified session
// identity (P6). This is a clean service-API seam (C-132) — no cross-module DB read.
// Zone starts the request PENDING (a submitter can never self-verify, C-120 §7).
const zoneHeaders = (token: string): Record<string, string> => ({
  'Content-Type': 'application/json',
  'x-request-id': crypto.randomUUID(),
  Authorization:  `Bearer ${token}`,
  ...(process.env.INTERNAL_SECRET && { 'x-internal-key': process.env.INTERNAL_SECRET }),
});

export interface ZoneRequestResult { ok: boolean; status: number; handle?: string; error?: string; }

/** Ask Zone to verify a project (owner forwards their JWT). Zone starts it PENDING. */
export async function requestZoneVerification(
  token: string | null, name: string, summary?: string,
): Promise<ZoneRequestResult> {
  if (!token) return { ok: false, status: 401, error: 'Sign in to request verification.' };
  if (!GW)    return { ok: false, status: 503, error: 'Zone is unavailable right now.' };
  try {
    const res = await fetch(`${GW}/api/identity/zone/verification`, {
      method:  'POST',
      headers: zoneHeaders(token),
      body:    JSON.stringify({ type: 'PROJECT', name, summary, note: `Epic project "${name}" submitted for Zone verification.` }),
      cache:   'no-store',
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.ok) {
      const handle = ((json?.data as Record<string, unknown> | undefined)?.entity as Record<string, unknown> | undefined)?.handle;
      return { ok: true, status: 200, handle: handle ? String(handle) : undefined };
    }
    const msg = res.status === 409 ? 'You already have a pending Zone request — one at a time.'
      : res.status === 401 ? 'Sign in to request verification.'
      : res.status === 400 ? 'Please check the project details.'
      : 'Could not reach Zone. Please try again.';
    return { ok: false, status: res.status, error: msg };
  } catch {
    return { ok: false, status: 503, error: 'Zone is unavailable right now.' };
  }
}

export type ZoneStatus = 'PENDING' | 'VERIFIED' | 'REVOKED';
export interface ZoneSubmissionStatus { status: ZoneStatus; handle: string; }

/** The Zone status of the caller's submission that matches this project name (or null). */
export async function zoneStatusForName(
  token: string | null, name: string,
): Promise<ZoneSubmissionStatus | null> {
  if (!token || !GW || !name.trim()) return null;
  try {
    const res = await fetch(`${GW}/api/identity/zone/my/submissions`, {
      headers: zoneHeaders(token), cache: 'no-store',
    });
    if (!res.ok) return null;
    const rows = ((await res.json().catch(() => ({})))?.data?.submissions ?? []) as Record<string, unknown>[];
    const match = rows.find((r) => String(r.name ?? '').trim().toLowerCase() === name.trim().toLowerCase());
    if (!match) return null;
    return { status: String(match.status ?? 'PENDING').toUpperCase() as ZoneStatus, handle: String(match.handle ?? '') };
  } catch { return null; }
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
