import { mapOrgError } from '@/contexts/OrganizationContext';

describe('mapOrgError', () => {
  const cases: [string, string][] = [
    ['Network unreachable', 'Network issue – please check your connection and retry.'],
    ['Timeout while fetching', 'Request timed out – try again.'],
    ['FORBIDDEN action', 'You lack permission for this action.'],
    ['Permission denied', 'You lack permission for this action.'],
    ['Resource not found', 'Requested resource was not found.'],
    ['Duplicate entry exists', 'A record with these details already exists.'],
    ['Validation failed for field', 'Some inputs were invalid – review and try again.'],
    ['Rate limit exceeded', 'Too many requests – wait a moment.'],
  ];
  it.each(cases)('maps %s', (input, expected) => {
    expect(mapOrgError(input)).toBe(expected);
  });
  it('passes through unknown message', () => {
    const raw = 'Strange backend response';
    expect(mapOrgError(raw)).toBe(raw);
  });
});
