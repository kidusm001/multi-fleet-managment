import { cn } from '../cn';

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'active', false && 'inactive');
    expect(result).toBe('base active');
  });

  it('should filter out falsy values', () => {
    const result = cn('foo', null, undefined, false, '', 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle arrays', () => {
    const result = cn(['foo', 'bar'], 'baz');
    expect(result).toContain('foo');
    expect(result).toContain('bar');
    expect(result).toContain('baz');
  });

  it('should handle objects', () => {
    const result = cn({
      foo: true,
      bar: false,
      baz: true
    });
    expect(result).toContain('foo');
    expect(result).not.toContain('bar');
    expect(result).toContain('baz');
  });

  it('should merge Tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    // Should override px-2 with px-4
    expect(result).toContain('px-4');
    expect(result).toContain('py-1');
  });

  it('should return empty string for no arguments', () => {
    const result = cn();
    expect(result).toBe('');
  });
});
