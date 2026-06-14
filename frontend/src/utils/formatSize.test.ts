import { describe, it, expect } from 'vitest';
import { formatSize } from '@/utils/formatSize';

describe('formatSize', () => {
  it('returns empty string for null', () => {
    expect(formatSize(null)).toBe('');
  });

  it('formats zero bytes', () => {
    expect(formatSize(0)).toBe('0 B');
  });

  it('formats bytes without decimals', () => {
    expect(formatSize(512)).toBe('512 B');
  });

  it('formats exactly 1 KB', () => {
    expect(formatSize(1024)).toBe('1.0 KB');
  });

  it('formats kilobytes with one decimal', () => {
    expect(formatSize(245760)).toBe('240.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatSize(3145728)).toBe('3.0 MB');
  });

  it('formats gigabytes', () => {
    expect(formatSize(5368709120)).toBe('5.0 GB');
  });
});
