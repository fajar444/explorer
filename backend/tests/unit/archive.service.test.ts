import { describe, it, expect } from 'bun:test';
import { zipSync, strToU8 } from 'fflate';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import SevenZipFactory from '7z-wasm';
import { ArchiveService } from '../../src/infrastructure/archive/archive.service';

describe('ArchiveService.canExtract', () => {
  const svc = new ArchiveService();
  it('supports zip, rar and 7z without native tools', () => {
    expect(svc.canExtract('zip').supported).toBe(true);
    expect(svc.canExtract('rar').supported).toBe(true);
    expect(svc.canExtract('7z').supported).toBe(true);
  });
  it('reports a reason for unknown/non-archive extensions', () => {
    const cap = svc.canExtract('txt');
    expect(cap.supported).toBe(false);
    expect(cap.reason).toBeString();
  });
});

describe('ArchiveService.extract (zip)', () => {
  it('extracts files and nested folders from a zip', async () => {
    const root = await mkdtemp(join(tmpdir(), 'explorer-zip-'));
    try {
      const zipped = zipSync({
        'hello.txt': strToU8('hello'),
        'sub/world.txt': strToU8('world'),
      });
      const archivePath = join(root, 'test.zip');
      await Bun.write(archivePath, zipped);

      const svc = new ArchiveService();
      const entries = await svc.extract(archivePath, 'zip');
      const files = entries.filter((e) => !e.isDirectory);
      const hello = files.find((e) => e.relativePath === 'hello.txt');
      const world = files.find((e) => e.relativePath === 'sub/world.txt');

      expect(hello).toBeDefined();
      expect(new TextDecoder().decode(hello!.data)).toBe('hello');
      expect(world).toBeDefined();
      expect(new TextDecoder().decode(world!.data)).toBe('world');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe('ArchiveService.extract (7z)', () => {
  it('extracts files from a 7z archive without native tools', async () => {
    const root = await mkdtemp(join(tmpdir(), 'explorer-7z-'));
    try {
      const maker = await SevenZipFactory({ print: () => {}, printErr: () => {} });
      maker.FS.writeFile('note.txt', new TextEncoder().encode('seven zip works'));
      maker.callMain(['a', 'made.7z', 'note.txt']);
      const archiveBytes = maker.FS.readFile('made.7z');
      const archivePath = join(root, 'made.7z');
      await Bun.write(archivePath, archiveBytes);

      const svc = new ArchiveService();
      const entries = await svc.extract(archivePath, '7z');
      const note = entries.find((e) => e.relativePath === 'note.txt');
      expect(note).toBeDefined();
      expect(new TextDecoder().decode(note!.data)).toBe('seven zip works');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe('ArchiveService.extract (filters macOS metadata)', () => {
  it('skips __MACOSX and dot-underscore entries', async () => {
    const root = await mkdtemp(join(tmpdir(), 'explorer-mac-'));
    try {
      const zipped = zipSync({
        'real.txt': strToU8('keep'),
        '__MACOSX/._real.txt': strToU8('junk'),
        '.DS_Store': strToU8('junk'),
      });
      const archivePath = join(root, 'mac.zip');
      await Bun.write(archivePath, zipped);

      const svc = new ArchiveService();
      const entries = await svc.extract(archivePath, 'zip');
      const names = entries.map((e) => e.relativePath);
      expect(names).toContain('real.txt');
      expect(names.some((n) => n.includes('__MACOSX'))).toBe(false);
      expect(names).not.toContain('.DS_Store');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
