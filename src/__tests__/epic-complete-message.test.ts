// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { completeErrorMessage } from '@/lib/epic/server';

// C12 — completing a project needs every milestone done. The backend refuses with
// 422 and says how many are open; that must reach the owner as-is, not as the
// "already completed" it used to share a branch with.
describe('completeErrorMessage', () => {
  it('422 passes the backend\'s lifecycle message through', () => {
    expect(completeErrorMessage(422, '2 milestones are still open — finish them before completing the project'))
      .toBe('2 milestones are still open — finish them before completing the project');
  });

  it('422 without a usable message still says what to do', () => {
    expect(completeErrorMessage(422, undefined)).toBe('Finish every milestone before completing the project.');
    expect(completeErrorMessage(422, ['x'])).toBe('Finish every milestone before completing the project.');
  });

  it('409 is the terminal state; 400 is no longer read as "already completed"', () => {
    expect(completeErrorMessage(409)).toBe('This project is already completed.');
    expect(completeErrorMessage(400, 'owner required')).toBe('Could not complete the project. Please try again.');
  });

  it('403 / 404 keep their caller-safe messages and never echo the backend', () => {
    expect(completeErrorMessage(403, 'Not your project')).toBe('This is not your project.');
    expect(completeErrorMessage(404, 'Project not found')).toBe('Project not found.');
  });
});
