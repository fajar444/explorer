import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { rm, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FilesystemStorageService } from '../../src/infrastructure/storage/filesystem-storage.service';

let root: string;
let storage: FilesystemStorageService;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'explorer-store-'));
  storage = new FilesystemStorageService(root);
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('FilesystemStorageService', () => {
  it('saves bytes and reports size', async () => {
    const data = new TextEncoder().encode('hello world');
    const { storageKey, size } = await storage.saveBytes(data);
    expect(storageKey).toBeString();
    expect(size).toBe(11);
    const readBack = await Bun.file(storage.absolutePath(storageKey)).text();
    expect(readBack).toBe('hello world');
  });

  it('copies a blob to a new key with identical content', async () => {
    const { storageKey } = await storage.saveBytes(new TextEncoder().encode('abc'));
    const copyKey = await storage.copy(storageKey);
    expect(copyKey).not.toBe(storageKey);
    expect(await Bun.file(storage.absolutePath(copyKey)).text()).toBe('abc');
  });

  it('deletes a blob and is a no-op if already gone', async () => {
    const { storageKey } = await storage.saveBytes(new TextEncoder().encode('x'));
    await storage.delete(storageKey);
    expect(await Bun.file(storage.absolutePath(storageKey)).exists()).toBe(false);
    await storage.delete(storageKey); // no throw
  });
});
