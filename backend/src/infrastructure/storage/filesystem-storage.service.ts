import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { join, isAbsolute, resolve } from 'node:path';
import type { IStorageService, StoredBlob } from '../../domain/services/storage.service.interface';

export class FilesystemStorageService implements IStorageService {
  private readonly root: string;

  constructor(rootDir: string) {
    this.root = isAbsolute(rootDir) ? rootDir : resolve(process.cwd(), rootDir);
  }

  private newKey(): string {
    const id = randomUUID();
    return `${id.slice(0, 2)}/${id}`;
  }

  absolutePath(storageKey: string): string {
    return join(this.root, storageKey);
  }

  async saveBytes(data: Uint8Array): Promise<StoredBlob> {
    const storageKey = this.newKey();
    await Bun.write(this.absolutePath(storageKey), data);
    return { storageKey, size: data.byteLength };
  }

  async copy(storageKey: string): Promise<string> {
    const bytes = await Bun.file(this.absolutePath(storageKey)).arrayBuffer();
    const newKey = this.newKey();
    await Bun.write(this.absolutePath(newKey), bytes);
    return newKey;
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await unlink(this.absolutePath(storageKey));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    }
  }
}
