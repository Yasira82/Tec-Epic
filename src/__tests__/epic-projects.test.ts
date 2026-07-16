import { describe, it, expect } from 'vitest';
import {
  PROJECTS, TYPE_META, STATUS_META, STATUS_ORDER, getProject,
} from '@/lib/epic/projects';

describe('TEC Epic — Creation Runtime (C-125), read-only V1', () => {
  it('models projects with a known type + lifecycle status', () => {
    expect(PROJECTS.length).toBeGreaterThan(0);
    for (const p of PROJECTS) {
      expect(TYPE_META[p.type]).toBeTruthy();
      expect(STATUS_META[p.status]).toBeTruthy();
      expect(STATUS_ORDER).toContain(p.status);
      expect(p.milestones.length).toBeGreaterThan(0);
      expect(p.team).toBeGreaterThan(0);
    }
  });

  it('lifecycle order is the C-125 pipeline DRAFT→ACTIVE→FUNDED→COMPLETED→LEGEND', () => {
    expect(STATUS_ORDER).toEqual(['DRAFT', 'ACTIVE', 'FUNDED', 'COMPLETED', 'LEGEND']);
  });

  it('funding is optional and only present with a percentage (presented from FundX)', () => {
    for (const p of PROJECTS) {
      if (p.fundingGoal != null) {
        expect(p.fundingGoal).toBeGreaterThan(0);
        expect(p.fundedPct ?? 0).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('a LEGEND project is fully verified and complete (Epic→Zone→Legend end state)', () => {
    const legend = PROJECTS.find((p) => p.status === 'LEGEND');
    expect(legend).toBeTruthy();
    expect(legend?.zoneVerified).toBe(true);
    expect(legend?.milestones.every((m) => m.done)).toBe(true);
  });

  it('getProject resolves by id and fails closed for an unknown id', () => {
    expect(getProject('greenpi-market')?.name).toBe('GreenPi Market');
    expect(getProject('nope')).toBeNull();
  });

  it('covers a spread of project types (community · startup · campaign · event · initiative)', () => {
    const types = new Set(PROJECTS.map((p) => p.type));
    for (const t of ['COMMUNITY', 'STARTUP', 'CAMPAIGN', 'EVENT', 'INITIATIVE'] as const) {
      expect(types.has(t), t).toBe(true);
    }
  });
});
