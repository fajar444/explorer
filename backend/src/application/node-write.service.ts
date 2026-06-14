import type { INodeRepository } from '../domain/repositories/node.repository.interface';
import type { IStorageService } from '../domain/services/storage.service.interface';
import type { IArchiveService } from '../domain/services/archive.service.interface';
import type { NodeEntity } from '../domain/entities/node.entity';
import { joinPath, extractExtension, recomputeChildPath } from './path.util';

export class NodeWriteService {
  constructor(
    private readonly repo: INodeRepository,
    private readonly storage: IStorageService,
    private readonly archive: IArchiveService,
  ) {}

  private async parentPathOf(parentId: string | null): Promise<string | null> {
    if (parentId === null) return null;
    const parent = await this.repo.findById(parentId);
    if (!parent) throw new Error(`Node ${parentId} not found`);
    if (parent.type !== 'folder') throw new Error('Parent must be a folder');
    return parent.path;
  }

  private async assertNameFree(parentId: string | null, name: string): Promise<void> {
    const existing = await this.repo.findByParentAndName(parentId, name);
    if (existing) throw new Error(`An item named "${name}" already exists here`);
  }

  private async uniqueName(parentId: string | null, name: string, isFolder = false): Promise<string> {
    if (!(await this.repo.findByParentAndName(parentId, name))) return name;
    let base = name;
    let ext = '';
    if (!isFolder) {
      const dot = name.lastIndexOf('.');
      const hasExt = dot > 0;
      base = hasExt ? name.slice(0, dot) : name;
      ext = hasExt ? name.slice(dot) : '';
    }
    let n = 1;
    let candidate = `${base}_${n}${ext}`;
    while (await this.repo.findByParentAndName(parentId, candidate)) {
      n += 1;
      candidate = `${base}_${n}${ext}`;
    }
    return candidate;
  }

  async createFolder(name: string, parentId: string | null): Promise<NodeEntity> {
    const parentPath = await this.parentPathOf(parentId);
    const finalName = await this.uniqueName(parentId, name, true);
    return this.repo.create({
      name: finalName, type: 'folder', parentId, path: joinPath(parentPath, finalName),
      size: null, extension: null, storageKey: null, mimeType: null,
    });
  }

  async rename(id: string, name: string): Promise<NodeEntity> {
    const node = await this.repo.findById(id);
    if (!node) throw new Error(`Node ${id} not found`);
    const sibling = await this.repo.findByParentAndName(node.parentId, name);
    if (sibling && sibling.id !== id) throw new Error(`An item named "${name}" already exists here`);

    const parentPath = await this.parentPathOf(node.parentId);
    const newPath = joinPath(parentPath, name);
    await this.repointSubtree(node, newPath, { name });
    return (await this.repo.findById(id))!;
  }

  async move(ids: string[], targetParentId: string | null): Promise<{ moved: number }> {
    const targetPath = await this.parentPathOf(targetParentId);
    let moved = 0;
    for (const id of ids) {
      const node = await this.repo.findById(id);
      if (!node) continue;
      if (id === targetParentId) throw new Error('Cannot move an item into itself');
      const subtree = await this.repo.findSubtree(id);
      if (targetParentId && subtree.some((s) => s.id === targetParentId)) {
        throw new Error('Cannot move a folder into its own subtree');
      }
      await this.assertNameFree(targetParentId, node.name);
      const newPath = joinPath(targetPath, node.name);
      await this.repointSubtree(node, newPath, { parentId: targetParentId }, subtree);
      moved += 1;
    }
    return { moved };
  }

  async copy(ids: string[], targetParentId: string | null): Promise<{ created: NodeEntity[] }> {
    const targetPath = await this.parentPathOf(targetParentId);
    const created: NodeEntity[] = [];
    for (const id of ids) {
      const root = await this.repo.findById(id);
      if (!root) continue;
      const subtree = await this.repo.findSubtree(id);
      const name = await this.uniqueName(targetParentId, root.name, root.type === 'folder');
      const idMap = new Map<string, string>();
      for (const original of subtree) {
        const isRoot = original.id === id;
        const newParentId = isRoot ? targetParentId : idMap.get(original.parentId!)!;
        const newParentPath = isRoot
          ? targetPath
          : created.find((c) => c.id === idMap.get(original.parentId!))?.path ?? targetPath;
        const newName = isRoot ? name : original.name;
        let storageKey: string | null = null;
        if (original.type === 'file' && original.storageKey) {
          storageKey = await this.storage.copy(original.storageKey);
        }
        const node = await this.repo.create({
          name: newName,
          type: original.type,
          parentId: newParentId,
          path: joinPath(newParentPath, newName),
          size: original.size,
          extension: original.extension,
          storageKey,
          mimeType: original.mimeType,
        });
        idMap.set(original.id, node.id);
        created.push(node);
      }
    }
    return { created };
  }

  async trash(ids: string[]): Promise<{ trashed: number }> {
    const now = new Date();
    let trashed = 0;
    for (const id of ids) {
      const node = await this.repo.findById(id);
      if (!node || node.isTrashed) continue;
      const subtree = await this.repo.findSubtree(id);
      for (const desc of subtree) {
        const isRoot = desc.id === id;
        await this.repo.update(desc.id, {
          isTrashed: true,
          trashedAt: now,
          ...(isRoot ? { originalParentId: node.parentId } : {}),
        });
      }
      trashed += 1;
    }
    return { trashed };
  }

  async restore(ids: string[]): Promise<{ restored: number }> {
    let restored = 0;
    for (const id of ids) {
      const node = await this.repo.findById(id);
      if (!node || !node.isTrashed) continue;
      let parentId: string | null = node.originalParentId;
      let parentPath: string | null = null;
      if (parentId) {
        const parent = await this.repo.findById(parentId);
        parentPath = parent && !parent.isTrashed ? parent.path : null;
        if (!parent || parent.isTrashed) parentId = null;
      }
      const subtree = await this.repo.findSubtree(id);
      const newPath = joinPath(parentPath, node.name);
      const oldPath = node.path;
      await this.repo.update(id, {
        isTrashed: false, trashedAt: null, originalParentId: null,
        parentId, path: newPath,
      });
      for (const desc of subtree) {
        if (desc.id === id) continue;
        await this.repo.update(desc.id, {
          isTrashed: false, trashedAt: null,
          path: recomputeChildPath(desc.path, oldPath, newPath),
        });
      }
      restored += 1;
    }
    return { restored };
  }

  async permanentDelete(ids: string[]): Promise<{ deleted: number }> {
    const allIds = new Set<string>();
    const storageKeys: string[] = [];
    for (const id of ids) {
      const subtree = await this.repo.findSubtree(id);
      for (const n of subtree) {
        allIds.add(n.id);
        if (n.storageKey) storageKeys.push(n.storageKey);
      }
    }
    const deleted = await this.repo.hardDelete([...allIds]);
    for (const key of storageKeys) await this.storage.delete(key);
    return { deleted: deleted.length };
  }

  async emptyTrash(): Promise<{ deleted: number }> {
    const trashed = await this.repo.findTrashed();
    return this.permanentDelete(trashed.map((n) => n.id));
  }

  async upload(
    parentId: string | null,
    files: { name: string; mimeType: string | null; data: Uint8Array }[],
  ): Promise<NodeEntity[]> {
    const parentPath = await this.parentPathOf(parentId);
    const created: NodeEntity[] = [];
    for (const file of files) {
      const name = await this.uniqueName(parentId, file.name, false);
      const { storageKey, size } = await this.storage.saveBytes(file.data);
      const node = await this.repo.create({
        name, type: 'file', parentId, path: joinPath(parentPath, name),
        size, extension: extractExtension(name),
        storageKey, mimeType: file.mimeType,
      });
      created.push(node);
    }
    return created;
  }

  async getContent(id: string): Promise<{ node: NodeEntity; absolutePath: string }> {
    const node = await this.repo.findById(id);
    if (!node) throw new Error(`Node ${id} not found`);
    if (node.type !== 'file' || !node.storageKey) throw new Error('This item has no content');
    return { node, absolutePath: this.storage.absolutePath(node.storageKey) };
  }

  async extract(id: string, targetParentId?: string | null): Promise<{ created: NodeEntity[] }> {
    const archiveNode = await this.repo.findById(id);
    if (!archiveNode) throw new Error(`Node ${id} not found`);
    if (archiveNode.type !== 'file' || !archiveNode.storageKey) throw new Error('This item has no content');

    const cap = this.archive.canExtract(archiveNode.extension);
    if (!cap.supported) throw new Error(cap.reason ?? 'Cannot extract this archive');

    const destParentId = targetParentId ?? archiveNode.parentId;
    const destPath = await this.parentPathOf(destParentId);

    const entries = await this.archive.extract(
      this.storage.absolutePath(archiveNode.storageKey),
      archiveNode.extension!,
    );
    entries.sort((a, b) => a.relativePath.split('/').length - b.relativePath.split('/').length);

    const dirIdByRel = new Map<string, string | null>();
    dirIdByRel.set('', destParentId);
    const created: NodeEntity[] = [];

    const ensureParent = (relPath: string): string | null => {
      const parentRel = relPath.includes('/') ? relPath.slice(0, relPath.lastIndexOf('/')) : '';
      return dirIdByRel.get(parentRel) ?? destParentId;
    };
    const pathFor = async (parentId: string | null, name: string): Promise<string> => {
      if (parentId === destParentId) return joinPath(destPath, name);
      const parent = await this.repo.findById(parentId!);
      return joinPath(parent?.path ?? destPath, name);
    };

    for (const entry of entries) {
      if (!this.isSafeArchivePath(entry.relativePath)) continue;
      const baseName = entry.relativePath.split('/').pop()!;
      if (!baseName) continue;
      const parentId = ensureParent(entry.relativePath);
      const name = await this.uniqueName(parentId, baseName, entry.isDirectory);
      if (entry.isDirectory) {
        const node = await this.repo.create({
          name, type: 'folder', parentId, path: await pathFor(parentId, name),
          size: null, extension: null, storageKey: null, mimeType: null,
        });
        dirIdByRel.set(entry.relativePath, node.id);
        created.push(node);
      } else {
        const { storageKey, size } = await this.storage.saveBytes(entry.data);
        const node = await this.repo.create({
          name, type: 'file', parentId, path: await pathFor(parentId, name),
          size, extension: extractExtension(name), storageKey, mimeType: null,
        });
        created.push(node);
      }
    }
    return { created };
  }

  async listTrash(): Promise<NodeEntity[]> {
    return this.repo.findTrashed();
  }

  private isSafeArchivePath(rel: string): boolean {
    if (!rel || rel.startsWith('/') || rel.startsWith('\\')) return false;
    if (/^[a-zA-Z]:/.test(rel)) return false;
    return !rel.split('/').some((seg) => seg === '..' || seg === '');
  }

  private async repointSubtree(
    node: NodeEntity,
    newPath: string,
    patch: { name?: string; parentId?: string | null },
    preloadedSubtree?: NodeEntity[],
  ): Promise<void> {
    const oldPath = node.path;
    const subtree = preloadedSubtree ?? (await this.repo.findSubtree(node.id));
    await this.repo.update(node.id, { ...patch, path: newPath });
    for (const desc of subtree) {
      if (desc.id === node.id) continue;
      await this.repo.update(desc.id, { path: recomputeChildPath(desc.path, oldPath, newPath) });
    }
  }
}
