import { unzipSync } from 'fflate';
import { createExtractorFromData } from 'node-unrar-js';
import SevenZipFactory from '7z-wasm';
import type {
  IArchiveService,
  ExtractedEntry,
  ExtractCapability,
} from '../../domain/services/archive.service.interface';

export class ArchiveService implements IArchiveService {
  canExtract(extension: string | null): ExtractCapability {
    const ext = extension?.toLowerCase() ?? '';
    if (ext === 'zip' || ext === 'rar' || ext === '7z') return { supported: true };
    return { supported: false, reason: `Cannot extract ".${ext}" files.` };
  }

  async extract(absolutePath: string, extension: string): Promise<ExtractedEntry[]> {
    const ext = extension.toLowerCase();
    let entries: ExtractedEntry[];
    if (ext === 'zip') entries = await this.extractZip(absolutePath);
    else if (ext === 'rar') entries = await this.extractRar(absolutePath);
    else if (ext === '7z') entries = await this.extractSevenZip(absolutePath);
    else throw new Error(`Cannot extract ".${ext}" files.`);
    return entries.filter((e) => !this.isJunkPath(e.relativePath));
  }

  private isJunkPath(relPath: string): boolean {
    const segments = relPath.split('/');
    if (segments.some((s) => s === '__MACOSX')) return true;
    const name = segments[segments.length - 1] ?? '';
    return name === '.DS_Store' || name.startsWith('._');
  }

  private async extractZip(absolutePath: string): Promise<ExtractedEntry[]> {
    const bytes = new Uint8Array(await Bun.file(absolutePath).arrayBuffer());
    const unzipped = unzipSync(bytes);
    const entries: ExtractedEntry[] = [];
    const dirs = new Set<string>();

    for (const [rawPath, data] of Object.entries(unzipped)) {
      const relPath = rawPath.replace(/\\/g, '/');
      if (relPath.endsWith('/')) {
        dirs.add(relPath.replace(/\/+$/, ''));
        continue;
      }
      const parts = relPath.split('/');
      for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join('/'));
      entries.push({ relativePath: relPath, isDirectory: false, data });
    }
    for (const dir of dirs) {
      if (dir) entries.push({ relativePath: dir, isDirectory: true, data: new Uint8Array() });
    }
    return entries;
  }

  private async extractRar(absolutePath: string): Promise<ExtractedEntry[]> {
    const data = await Bun.file(absolutePath).arrayBuffer();
    const extractor = await createExtractorFromData({ data });
    const extracted = extractor.extract();
    const entries: ExtractedEntry[] = [];
    const dirs = new Set<string>();

    for (const file of [...extracted.files]) {
      const relPath = file.fileHeader.name.replace(/\\/g, '/');
      if (file.fileHeader.flags.directory) {
        dirs.add(relPath.replace(/\/+$/, ''));
        continue;
      }
      const parts = relPath.split('/');
      for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join('/'));
      entries.push({ relativePath: relPath, isDirectory: false, data: file.extraction ?? new Uint8Array() });
    }
    for (const dir of dirs) {
      if (dir) entries.push({ relativePath: dir, isDirectory: true, data: new Uint8Array() });
    }
    return entries;
  }

  private async extractSevenZip(absolutePath: string): Promise<ExtractedEntry[]> {
    const data = new Uint8Array(await Bun.file(absolutePath).arrayBuffer());
    const sevenZip = await SevenZipFactory({ print: () => {}, printErr: () => {} });
    sevenZip.FS.writeFile('input.7z', data);
    sevenZip.FS.mkdir('/out');
    sevenZip.callMain(['x', 'input.7z', '-o/out', '-y']);
    return this.readVfs(sevenZip, '/out', '/out');
  }

  private readVfs(
    sevenZip: Awaited<ReturnType<typeof SevenZipFactory>>,
    dir: string,
    base: string,
  ): ExtractedEntry[] {
    const out: ExtractedEntry[] = [];
    for (const name of sevenZip.FS.readdir(dir)) {
      if (name === '.' || name === '..') continue;
      const full = `${dir}/${name}`;
      const rel = full.slice(base.length + 1);
      const stat = sevenZip.FS.stat(full);
      if (sevenZip.FS.isDir(stat.mode)) {
        out.push({ relativePath: rel, isDirectory: true, data: new Uint8Array() });
        out.push(...this.readVfs(sevenZip, full, base));
      } else {
        out.push({ relativePath: rel, isDirectory: false, data: sevenZip.FS.readFile(full) });
      }
    }
    return out;
  }
}
