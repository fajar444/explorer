import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { NodeWriteService } from '../../src/application/node-write.service';
import type { INodeRepository } from '../../src/domain/repositories/node.repository.interface';
import type { IStorageService } from '../../src/domain/services/storage.service.interface';
import type { IArchiveService } from '../../src/domain/services/archive.service.interface';
import type { NodeEntity } from '../../src/domain/entities/node.entity';

const makeNode = (o: Partial<NodeEntity> = {}): NodeEntity => ({
  id: 'n1', name: 'Folder', type: 'folder', parentId: null, path: '/Folder',
  size: null, extension: null, storageKey: null, mimeType: null,
  isTrashed: false, trashedAt: null, originalParentId: null,
  createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01'), ...o,
});

function makeRepo(over: Partial<INodeRepository> = {}): INodeRepository {
  return {
    findById: mock(async () => null),
    findChildren: mock(async () => []),
    findTree: mock(async () => []),
    search: mock(async () => []),
    findTrashed: mock(async () => []),
    findByParentAndName: mock(async () => null),
    findSubtree: mock(async () => []),
    create: mock(async (d: any) => makeNode({ id: 'new', ...d })),
    update: mock(async (id: string, p: any) => makeNode({ id, ...p })),
    hardDelete: mock(async () => []),
    ...over,
  };
}
const storage: IStorageService = {
  saveBytes: mock(async () => ({ storageKey: 'k', size: 1 })),
  copy: mock(async () => 'copy-key'),
  delete: mock(async () => {}),
  absolutePath: mock(() => '/abs'),
};
const archive: IArchiveService = {
  canExtract: mock(() => ({ supported: true })),
  extract: mock(async () => []),
};

describe('NodeWriteService.createFolder', () => {
  it('creates a folder under a parent with a computed path', async () => {
    const repo = makeRepo({ findById: mock(async () => makeNode({ id: 'p', path: '/Docs' })) });
    const svc = new NodeWriteService(repo, storage, archive);
    const result = await svc.createFolder('New', 'p');
    expect(repo.create).toHaveBeenCalled();
    expect(result.path).toBe('/Docs/New');
    expect(result.type).toBe('folder');
  });

  it('automatically renames a duplicate folder name in the same parent', async () => {
    const repo = makeRepo({
      findById: mock(async () => makeNode({ id: 'p', path: '/Docs' })),
      findByParentAndName: mock(async (parentId: string | null, name: string) => {
        if (name === 'New') return makeNode({ name: 'New' });
        return null;
      }),
    });
    const svc = new NodeWriteService(repo, storage, archive);
    const result = await svc.createFolder('New', 'p');
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'New_1' }));
    expect(result.name).toBe('New_1');
  });
});

describe('NodeWriteService.rename', () => {
  it('renames and updates the path of the node and its descendants', async () => {
    const node = makeNode({ id: 'b', name: 'B', parentId: 'a', path: '/A/B' });
    const child = makeNode({ id: 'c', name: 'c.txt', type: 'file', parentId: 'b', path: '/A/B/c.txt' });
    const repo = makeRepo({
      findById: mock(async (id: string) => (id === 'b' ? node : id === 'a' ? makeNode({ id: 'a', path: '/A' }) : null)),
      findByParentAndName: mock(async () => null),
      findSubtree: mock(async () => [node, child]),
    });
    const svc = new NodeWriteService(repo, storage, archive);
    await svc.rename('b', 'Bee');
    expect(repo.update).toHaveBeenCalledWith('b', expect.objectContaining({ name: 'Bee', path: '/A/Bee' }));
    expect(repo.update).toHaveBeenCalledWith('c', expect.objectContaining({ path: '/A/Bee/c.txt' }));
  });
});

describe('NodeWriteService.move', () => {
  it('rejects moving a folder into its own descendant', async () => {
    const node = makeNode({ id: 'a', path: '/A' });
    const desc = makeNode({ id: 'a1', parentId: 'a', path: '/A/A1' });
    const repo = makeRepo({
      findById: mock(async (id: string) => (id === 'a' ? node : id === 'a1' ? desc : makeNode({ id }))),
      findSubtree: mock(async () => [node, desc]),
    });
    const svc = new NodeWriteService(repo, storage, archive);
    await expect(svc.move(['a'], 'a1')).rejects.toThrow(/into its own/i);
  });

  it('moves nodes under the target and reports the count', async () => {
    const node = makeNode({ id: 'x', name: 'X', parentId: 'a', path: '/A/X' });
    const target = makeNode({ id: 't', path: '/T' });
    const repo = makeRepo({
      findById: mock(async (id: string) => (id === 'x' ? node : id === 't' ? target : null)),
      findByParentAndName: mock(async () => null),
      findSubtree: mock(async () => [node]),
    });
    const svc = new NodeWriteService(repo, storage, archive);
    const res = await svc.move(['x'], 't');
    expect(res.moved).toBe(1);
    expect(repo.update).toHaveBeenCalledWith('x', expect.objectContaining({ parentId: 't', path: '/T/X' }));
  });
});

describe('NodeWriteService.copy', () => {
  it('deep-copies a folder subtree, copying file bytes', async () => {
    const folder = makeNode({ id: 'f', name: 'F', parentId: null, path: '/F' });
    const file = makeNode({ id: 'fi', name: 'a.txt', type: 'file', parentId: 'f', path: '/F/a.txt', storageKey: 'k1', size: 3, mimeType: 'text/plain', extension: 'txt' });
    const target = makeNode({ id: 't', path: '/T' });
    const repo = makeRepo({
      findById: mock(async (id: string) => (id === 'f' ? folder : id === 't' ? target : null)),
      findByParentAndName: mock(async () => null),
      findSubtree: mock(async () => [folder, file]),
    });
    const svc = new NodeWriteService(repo, storage, archive);
    const res = await svc.copy(['f'], 't');
    expect(res.created.length).toBeGreaterThan(0);
    expect(storage.copy).toHaveBeenCalledWith('k1');
  });
});

describe('NodeWriteService.trash', () => {
  it('soft-deletes a subtree and records original parent on the root', async () => {
    const folder = makeNode({ id: 'f', parentId: 'p', path: '/P/F' });
    const child = makeNode({ id: 'c', parentId: 'f', path: '/P/F/c' });
    const repo = makeRepo({
      findById: mock(async (id: string) => (id === 'f' ? folder : null)),
      findSubtree: mock(async () => [folder, child]),
    });
    const svc = new NodeWriteService(repo, storage, archive);
    const res = await svc.trash(['f']);
    expect(res.trashed).toBe(1);
    expect(repo.update).toHaveBeenCalledWith('f', expect.objectContaining({ isTrashed: true, originalParentId: 'p' }));
    expect(repo.update).toHaveBeenCalledWith('c', expect.objectContaining({ isTrashed: true }));
  });
});

describe('NodeWriteService.restore', () => {
  it('restores a trashed node to its original parent', async () => {
    const folder = makeNode({ id: 'f', parentId: null, path: '/P/F', isTrashed: true, originalParentId: 'p' });
    const parent = makeNode({ id: 'p', path: '/P' });
    const repo = makeRepo({
      findById: mock(async (id: string) => (id === 'f' ? folder : id === 'p' ? parent : null)),
      findSubtree: mock(async () => [folder]),
    });
    const svc = new NodeWriteService(repo, storage, archive);
    const res = await svc.restore(['f']);
    expect(res.restored).toBe(1);
    expect(repo.update).toHaveBeenCalledWith('f', expect.objectContaining({ isTrashed: false, parentId: 'p' }));
  });
});

describe('NodeWriteService.permanentDelete', () => {
  it('hard-deletes subtrees and removes file bytes', async () => {
    const folder = makeNode({ id: 'f', path: '/F' });
    const file = makeNode({ id: 'fi', type: 'file', parentId: 'f', path: '/F/a', storageKey: 'k1' });
    const repo = makeRepo({
      findById: mock(async (id: string) => (id === 'f' ? folder : null)),
      findSubtree: mock(async () => [folder, file]),
      hardDelete: mock(async () => [folder, file]),
    });
    const svc = new NodeWriteService(repo, storage, archive);
    const res = await svc.permanentDelete(['f']);
    expect(res.deleted).toBe(2);
    expect(storage.delete).toHaveBeenCalledWith('k1');
  });
});

describe('NodeWriteService.emptyTrash', () => {
  it('permanently deletes everything in the trash', async () => {
    const t1 = makeNode({ id: 't1', isTrashed: true });
    const repo = makeRepo({
      findTrashed: mock(async () => [t1]),
      findById: mock(async () => t1),
      findSubtree: mock(async () => [t1]),
      hardDelete: mock(async () => [t1]),
    });
    const svc = new NodeWriteService(repo, storage, archive);
    const res = await svc.emptyTrash();
    expect(res.deleted).toBeGreaterThanOrEqual(1);
  });
});

describe('NodeWriteService.upload', () => {
  it('stores bytes and creates a file node with mime + extension', async () => {
    const parent = makeNode({ id: 'p', path: '/P' });
    const repo = makeRepo({
      findById: mock(async () => parent),
      findByParentAndName: mock(async () => null),
    });
    const svc = new NodeWriteService(repo, storage, archive);
    const created = await svc.upload('p', [
      { name: 'note.txt', mimeType: 'text/plain', data: new TextEncoder().encode('hi') },
    ]);
    expect(storage.saveBytes).toHaveBeenCalled();
    expect(created[0].type).toBe('file');
    expect(created[0].extension).toBe('txt');
    expect(created[0].mimeType).toBe('text/plain');
  });
});

describe('NodeWriteService.getContent', () => {
  it('returns the node and its absolute path for a stored file', async () => {
    const file = makeNode({ id: 'fi', type: 'file', storageKey: 'k1', path: '/a.txt' });
    const repo = makeRepo({ findById: mock(async () => file) });
    const svc = new NodeWriteService(repo, storage, archive);
    const res = await svc.getContent('fi');
    expect(res.node.id).toBe('fi');
    expect(storage.absolutePath).toHaveBeenCalledWith('k1');
  });

  it('throws for a node without stored bytes', async () => {
    const folder = makeNode({ id: 'f', type: 'folder', storageKey: null });
    const repo = makeRepo({ findById: mock(async () => folder) });
    const svc = new NodeWriteService(repo, storage, archive);
    await expect(svc.getContent('f')).rejects.toThrow(/no content/i);
  });
});

describe('NodeWriteService.extract', () => {
  it('rejects when the archive type is unsupported', async () => {
    const file = makeNode({ id: 'a', type: 'file', extension: '7z', storageKey: 'k', parentId: 'p', path: '/P/a.7z' });
    const repo = makeRepo({ findById: mock(async () => file) });
    const arch: IArchiveService = {
      canExtract: mock(() => ({ supported: false, reason: 'Install 7z' })),
      extract: mock(async () => []),
    };
    const svc = new NodeWriteService(repo, storage, arch);
    await expect(svc.extract('a')).rejects.toThrow(/install 7z/i);
  });

  it('creates folder + file nodes from archive entries', async () => {
    const file = makeNode({ id: 'a', type: 'file', extension: 'zip', storageKey: 'k', parentId: 'p', path: '/P/a.zip' });
    const parent = makeNode({ id: 'p', path: '/P' });
    const repo = makeRepo({
      findById: mock(async (id: string) => (id === 'a' ? file : id === 'p' ? parent : null)),
      findByParentAndName: mock(async () => null),
    });
    const arch: IArchiveService = {
      canExtract: mock(() => ({ supported: true })),
      extract: mock(async () => [
        { relativePath: 'sub', isDirectory: true, data: new Uint8Array() },
        { relativePath: 'sub/x.txt', isDirectory: false, data: new TextEncoder().encode('x') },
      ]),
    };
    const svc = new NodeWriteService(repo, storage, arch);
    const res = await svc.extract('a');
    expect(res.created.length).toBe(2);
  });

  it('skips unsafe (path-traversal / absolute) archive entries', async () => {
    const file = makeNode({ id: 'a', type: 'file', extension: 'zip', storageKey: 'k', parentId: 'p', path: '/P/a.zip' });
    const parent = makeNode({ id: 'p', path: '/P' });
    const repo = makeRepo({
      findById: mock(async (id: string) => (id === 'a' ? file : id === 'p' ? parent : null)),
      findByParentAndName: mock(async () => null),
    });
    const arch: IArchiveService = {
      canExtract: mock(() => ({ supported: true })),
      extract: mock(async () => [
        { relativePath: 'safe.txt', isDirectory: false, data: new TextEncoder().encode('ok') },
        { relativePath: '../evil.txt', isDirectory: false, data: new TextEncoder().encode('bad') },
        { relativePath: '/abs.txt', isDirectory: false, data: new TextEncoder().encode('bad') },
      ]),
    };
    const svc = new NodeWriteService(repo, storage, arch);
    const res = await svc.extract('a');
    expect(res.created.length).toBe(1);
    expect(res.created[0].name).toBe('safe.txt');
  });
});
