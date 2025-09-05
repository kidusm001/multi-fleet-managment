import { mapOrgError } from '@/contexts/OrganizationContext';

describe('mapOrgError edge cases', () => {
  it('maps network timeouts and rate limits', () => {
    expect(mapOrgError('Network failure')).toMatch(/Network issue/);
    expect(mapOrgError('timeout exceeded')).toMatch(/timed out/i);
    expect(mapOrgError('RATE LIMIT reached')).toMatch(/Too many requests/i);
  });
  it('maps not found and duplicate', () => {
    expect(mapOrgError('Not Found')).toMatch(/resource was not found/i);
    expect(mapOrgError('duplicate key')).toMatch(/already exists/i);
  });
  it('returns raw for unknown non-empty', () => {
    expect(mapOrgError('Some other error')).toBe('Some other error');
  });
  it('handles empty input', () => {
    expect(mapOrgError('')).toMatch(/unexpected error/i);
  });
});
