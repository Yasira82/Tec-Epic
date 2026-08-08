// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// TEC Epic — public project discovery BFF (C-125). No session required (the whole Pi
// community browses); the internal key authorizes the gateway hop. Trust-first ordering
// is the backend's; the BFF whitelists the optional category filter.
const GW = 'https://api.example.com';

const req = (url: string) => new NextRequest(url, { method: 'GET' });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.API_GATEWAY_URL = GW;
  process.env.INTERNAL_SECRET = 'secret';
});

describe('GET /api/bff/epic/discover (public directory)', () => {
  it('forwards to the public discover endpoint with the internal key and NO user token', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ data: { projects: [{ slug: 'greenpi', name: 'GreenPi', zone_verified: true, featured: true, milestones: [] }] } }),
    } as Response);

    const { GET } = await import('@/app/api/bff/epic/discover/route');
    const res  = await GET(req('http://localhost/api/bff/epic/discover'));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.projects[0].id).toBe('greenpi');
    expect(json.projects[0].featured).toBe(true);

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toBe(`${GW}/api/identity/epic/discover`);
    expect(init.headers['x-internal-key']).toBe('secret');
    expect(init.headers.Authorization).toBeUndefined();   // public — no user token
    fetchSpy.mockRestore();
  });

  it('passes a whitelisted category through but drops a malformed one', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true, status: 200, json: async () => ({ data: { projects: [] } }),
    } as Response);
    const { GET } = await import('@/app/api/bff/epic/discover/route');

    await GET(req('http://localhost/api/bff/epic/discover?category=Education'));
    expect((fetchSpy.mock.calls[0] as [string])[0]).toBe(`${GW}/api/identity/epic/discover?category=Education`);

    await GET(req('http://localhost/api/bff/epic/discover?category=%2E%2E%2Fx'));
    expect((fetchSpy.mock.calls[1] as [string])[0]).toBe(`${GW}/api/identity/epic/discover`);
    fetchSpy.mockRestore();
  });

  it('returns an empty list when the gateway is unreachable (honest, no sample)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('down'));
    const { GET } = await import('@/app/api/bff/epic/discover/route');
    const res = await GET(req('http://localhost/api/bff/epic/discover'));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.projects).toEqual([]);
    fetchSpy.mockRestore();
  });
});
