import { describe, it, expect } from 'vitest';
import { previewKind, isArchive } from './previewKind';
import type { Node } from '@/types/node';

const f = (over: Partial<Node>): Node => ({
  id: 'x', name: 'n', type: 'file', parentId: null, path: '/n', size: 1,
  extension: null, storageKey: 'k', mimeType: null, createdAt: '', updatedAt: '', ...over,
});

describe('previewKind', () => {
  it('returns none for folders', () => {
    expect(previewKind(f({ type: 'folder', storageKey: null }))).toBe('none');
  });
  it('returns none for files without stored bytes', () => {
    expect(previewKind(f({ storageKey: null, extension: 'png' }))).toBe('none');
  });
  it('detects images by mime and by extension', () => {
    expect(previewKind(f({ mimeType: 'image/png' }))).toBe('image');
    expect(previewKind(f({ extension: 'jpg' }))).toBe('image');
    expect(previewKind(f({ extension: 'svg' }))).toBe('image');
  });
  it('detects pdf', () => {
    expect(previewKind(f({ extension: 'pdf' }))).toBe('pdf');
    expect(previewKind(f({ mimeType: 'application/pdf' }))).toBe('pdf');
  });
  it('detects video (web formats) and audio', () => {
    expect(previewKind(f({ extension: 'mp4' }))).toBe('video');
    expect(previewKind(f({ extension: 'webm' }))).toBe('video');
    expect(previewKind(f({ extension: 'mp3' }))).toBe('audio');
    expect(previewKind(f({ mimeType: 'audio/wav' }))).toBe('audio');
  });
  it('detects text/code', () => {
    expect(previewKind(f({ extension: 'txt' }))).toBe('text');
    expect(previewKind(f({ extension: 'json' }))).toBe('text');
    expect(previewKind(f({ mimeType: 'text/plain' }))).toBe('text');
  });
  it('returns none for unknown binary types', () => {
    expect(previewKind(f({ extension: 'exe' }))).toBe('none');
  });
});

describe('isArchive', () => {
  it('is true for zip/rar/7z', () => {
    expect(isArchive(f({ extension: 'zip' }))).toBe(true);
    expect(isArchive(f({ extension: 'rar' }))).toBe(true);
    expect(isArchive(f({ extension: '7z' }))).toBe(true);
  });
  it('is false otherwise', () => {
    expect(isArchive(f({ extension: 'png' }))).toBe(false);
  });
});
