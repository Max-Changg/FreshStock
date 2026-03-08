import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('when merging class names with cn', () => {
  it('joins multiple string arguments with a space', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
  });

  it('filters out falsy values', () => {
    expect(cn('foo', false, null, undefined, '', 'bar')).toBe('foo bar');
  });

  it('flattens nested arrays', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  it('returns an empty string when all inputs are falsy', () => {
    expect(cn(false, null, undefined)).toBe('');
  });

  it('returns the single class when given one valid string', () => {
    expect(cn('only-class')).toBe('only-class');
  });

  it('handles mixed arrays and scalars together', () => {
    expect(cn('a', ['b', 'c'], false, 'd')).toBe('a b c d');
  });

  it('does not include numeric values', () => {
    expect(cn('a', 0 as unknown as string, 'b')).toBe('a b');
  });
});
