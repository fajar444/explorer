import { describe, it, expect } from 'bun:test';
import { joinPath, extractExtension, recomputeChildPath } from '../../src/application/path.util';

describe('joinPath', () => {
  it('joins under a root (null parent path)', () => {
    expect(joinPath(null, 'Documents')).toBe('/Documents');
  });
  it('joins under a folder path', () => {
    expect(joinPath('/Documents', 'Projects')).toBe('/Documents/Projects');
  });
  it('treats "/" parent as root', () => {
    expect(joinPath('/', 'A')).toBe('/A');
  });
});

describe('extractExtension', () => {
  it('returns lowercased extension', () => {
    expect(extractExtension('Resume.PDF')).toBe('pdf');
  });
  it('returns null for no extension', () => {
    expect(extractExtension('README')).toBe(null);
  });
  it('returns null for dotfiles (leading dot only)', () => {
    expect(extractExtension('.gitignore')).toBe(null);
  });
  it('returns null when name ends with a dot', () => {
    expect(extractExtension('weird.')).toBe(null);
  });
});

describe('recomputeChildPath', () => {
  it('replaces the old ancestor prefix with the new one', () => {
    expect(recomputeChildPath('/A/B/x.txt', '/A/B', '/C/B')).toBe('/C/B/x.txt');
  });
  it('handles the moved node itself', () => {
    expect(recomputeChildPath('/A/B', '/A/B', '/C/B')).toBe('/C/B');
  });
});
