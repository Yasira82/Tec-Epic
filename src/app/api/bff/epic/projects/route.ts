import { NextRequest, NextResponse } from 'next/server';
import { resolveOwnProjects, createProject, resolveProStatus, setFeaturedForOwner } from '@/lib/epic/server';
import { isE2eMode, e2eStub } from '@/lib/server/e2e-mode';

// GET /api/bff/epic/projects — the project board (C-125), read-only.
// Epic is the Creation Runtime: it OWNS project creation/structure/lifecycle and
// COORDINATES the owning apps (Zone verifies, FundX funds, Legend records).
// Identity is derived from the `tec_user` session cookie server-side — NEVER a query
// param or body (P6). The owner is passed to the backend; on no session / unreachable
// backend the source is 'unavailable' with no projects (honest empty state, C-135 §4). Verification is
// presented from Zone and funding from FundX — never derived here.
function ownerFromSession(req: NextRequest): string | null {
  try {
    const raw = req.cookies.get('tec_user')?.value ?? '';
    if (!raw) return null;
    let u: Record<string, unknown>;
    try { u = JSON.parse(raw); } catch { u = JSON.parse(decodeURIComponent(raw)); }
    const owner = (u.piUsername ?? u.username) as string | undefined;
    return owner && owner.trim() ? owner : null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const owner = ownerFromSession(req);
  const { projects, source } = await resolveOwnProjects(owner);

  // Epic Pro — FEATURED sync (C-125). Reconcile the owner's projects' featured flag with
  // their LIVE subscription (commerce-owned, P5). Featured is visibility ONLY (it ranks
  // below zone_verified); a lapsed Pro clears it on the next board load. Best-effort:
  // never blocks the read; only when the owner actually has projects.
  let isPro = false;
  if (owner && projects.length > 0) {
    const token = req.cookies.get('tec_access_token')?.value ?? null;
    isPro = await resolveProStatus(token);
    if (projects.some((p) => Boolean(p.featured) !== isPro)) {
      await setFeaturedForOwner(owner, isPro);          // reconcile persisted flags
      projects.forEach((p) => { p.featured = isPro; }); // reflect immediately
    }
  }

  return NextResponse.json(
    { source, projects, isPro },
    { headers: { 'Cache-Control': 'private, max-age=60' } },
  );
}

// POST /api/bff/epic/projects — create the caller's OWN project (C-125). Identity is
// derived from the `tec_user` session cookie server-side — NEVER the request body
// (P6). The body carries only type/name/tagline/category; the owner is resolved here
// and the backend re-validates. Honest statuses flow back (401 no session · 400 bad
// input · 503 unreachable).
export async function POST(req: NextRequest) {
  if (isE2eMode()) return e2eStub(201, { project: null });

  const body = (await req.json().catch(() => ({}))) as {
    type?: unknown; name?: unknown; tagline?: unknown; category?: unknown;
  };
  const input = {
    type:     typeof body.type === 'string' ? body.type : '',
    name:     typeof body.name === 'string' ? body.name : '',
    tagline:  typeof body.tagline === 'string' ? body.tagline : undefined,
    category: typeof body.category === 'string' ? body.category : undefined,
  };

  const owner = ownerFromSession(req);
  const result = await createProject(owner, input);
  return NextResponse.json(
    { ok: result.ok, project: result.project ?? null, error: result.error },
    { status: result.ok ? 201 : result.status },
  );
}
