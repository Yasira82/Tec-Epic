import { NextRequest, NextResponse } from 'next/server';
import { resolveProject, requestZoneVerification } from '@/lib/epic/server';
import { isE2eMode, e2eStub } from '@/lib/server/e2e-mode';

// POST /api/bff/epic/verify — the OWNER asks Zone to verify their Epic project
// (C-121 "create → verify"). Identity is derived from the session cookies server-side
// (P6): the owner from `tec_user`, the JWT (forwarded to Zone) from `tec_access_token`.
// Epic never mints verification — Zone starts the request PENDING (C-120 §7). Honest
// statuses flow back (401 no session · 403 not your project · 409 already pending).
function sessionFrom(req: NextRequest): { owner: string | null; token: string | null } {
  let owner: string | null = null;
  try {
    const raw = req.cookies.get('tec_user')?.value ?? '';
    if (raw) {
      let u: Record<string, unknown>;
      try { u = JSON.parse(raw); } catch { u = JSON.parse(decodeURIComponent(raw)); }
      const name = (u.piUsername ?? u.username) as string | undefined;
      owner = name && name.trim() ? name : null;
    }
  } catch { owner = null; }
  const token = req.cookies.get('tec_access_token')?.value ?? null;
  return { owner, token };
}

export async function POST(req: NextRequest) {
  if (isE2eMode()) return e2eStub(200, { handle: null });

  const body = (await req.json().catch(() => ({}))) as { slug?: unknown };
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  if (!slug) return NextResponse.json({ ok: false, error: 'slug required' }, { status: 400 });

  const { owner, token } = sessionFrom(req);
  if (!owner || !token) {
    return NextResponse.json({ ok: false, error: 'Sign in to request verification.' }, { status: 401 });
  }

  // Only the project owner may request its verification (P6). Resolve server-side.
  const { project, source } = await resolveProject(slug);
  if (!project) {
    return NextResponse.json(
      { ok: false, error: source === 'live' ? 'Project not found.' : 'Epic is unavailable right now.' },
      { status: source === 'live' ? 404 : 503 },
    );
  }
  if (project.owner && project.owner !== owner) {
    return NextResponse.json({ ok: false, error: 'This is not your project.' }, { status: 403 });
  }

  const result = await requestZoneVerification(token, project.name, project.tagline);
  return NextResponse.json(
    { ok: result.ok, handle: result.handle ?? null, error: result.error },
    { status: result.ok ? 200 : result.status },
  );
}
