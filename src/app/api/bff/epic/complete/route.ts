import { NextRequest, NextResponse } from 'next/server';
import { completeProject } from '@/lib/epic/server';
import { isE2eMode, e2eStub } from '@/lib/server/e2e-mode';

// POST /api/bff/epic/complete — graduate the caller's OWN project to LEGEND and let
// the backend emit epic.project.completed.v1 (value chain → Legend, C-125). Identity
// is derived from the `tec_user` session cookie server-side — NEVER the request body
// (P6). The body carries only the project slug; the owner is resolved here and the
// backend re-enforces owner-scope + terminal-state. Honest statuses flow back to the
// UI (401 no session · 403 not yours · 409 already complete · 503 unreachable).
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

export async function POST(req: NextRequest) {
  if (isE2eMode()) return e2eStub(200, { project: null });

  const body = (await req.json().catch(() => ({}))) as { slug?: unknown };
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  if (!slug) return NextResponse.json({ ok: false, error: 'slug required' }, { status: 400 });

  const owner = ownerFromSession(req);
  const result = await completeProject(owner, slug);
  return NextResponse.json(
    { ok: result.ok, project: result.project ?? null, error: result.error },
    { status: result.ok ? 200 : result.status },
  );
}
