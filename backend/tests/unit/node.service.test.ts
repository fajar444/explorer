import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { NodeService } from '../../src/application/node.service';
import type { INodeRepository } from '../../src/domain/repositories/node.repository.interface';
import type { NodeEntity, NodeTree } from '../../src/domain/entities/node.entity';

const makeNode = (overrides: Partial<NodeEntity> = {}): NodeEntity => ({
  id: 'node-1',
  name: 'Documents',
  type: 'folder',
  parentId: null,
  path: '/Documents',
  size: null,
  extension: null,
  storageKey: null,
  mimeType: null,
  isTrashed: false,
  trashedAt: null,
  originalParentId: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('NodeService', () => {
  let mockRepo: INodeRepository;
  let service: NodeService;

  beforeEach(() => {
    mockRepo = {
      findById: mock(async (id: string) => (id === 'node-1' ? makeNode() : null)),
      findChildren: mock(async () => [makeNode({ id: 'child-1', name: 'Sub', parentId: 'node-1' })]),
      findTree: mock(async (): Promise<NodeTree[]> => [{ ...makeNode(), children: [] }]),
      search: mock(async (q: string) => (q ? [makeNode()] : [])),
      findTrashed: mock(async () => []),
      findByParentAndName: mock(async () => null),
      findSubtree: mock(async () => []),
      create: mock(async () => makeNode()),
      update: mock(async () => makeNode()),
      hardDelete: mock(async () => []),
    };
    service = new NodeService(mockRepo);
  });

  describe('getTree', () => {
    it('returns tree array from repository', async () => {
      const result = await service.getTree();
      expect(result).toHaveLength(1);
      expect(result[0].children).toBeArray();
    });
  });

  describe('getChildren', () => {
    it('returns children for existing node', async () => {
      const result = await service.getChildren('node-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Sub');
    });

    it('throws when node does not exist', async () => {
      await expect(service.getChildren('nonexistent')).rejects.toThrow(
        'Node nonexistent not found'
      );
    });
  });

  describe('search', () => {
    it('returns empty array for empty string', async () => {
      const result = await service.search('');
      expect(result).toHaveLength(0);
    });

    it('returns empty array for whitespace-only string', async () => {
      const result = await service.search('   ');
      expect(result).toHaveLength(0);
    });

    it('passes trimmed query to repository', async () => {
      await service.search('  Doc  ');
      expect(mockRepo.search).toHaveBeenCalledWith('Doc');
    });
  });
});
