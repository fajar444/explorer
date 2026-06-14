import { describe, it, expect } from 'bun:test';
import { NodeDrizzleRepository } from '../../src/infrastructure/repositories/node.drizzle.repository';
import type { NodeEntity } from '../../src/domain/entities/node.entity';

const makeNode = (overrides: Partial<NodeEntity>): NodeEntity => ({
  id: 'id',
  name: 'Node',
  type: 'folder',
  parentId: null,
  path: '/Node',
  size: null,
  extension: null,
  storageKey: null,
  mimeType: null,
  isTrashed: false,
  trashedAt: null,
  originalParentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('NodeDrizzleRepository — buildTree', () => {
  const repo = new NodeDrizzleRepository({} as any);
  const buildTree = (list: NodeEntity[], parentId: string | null) =>
    (repo as any).buildTree(list, parentId);

  it('returns empty array for empty input', () => {
    expect(buildTree([], null)).toEqual([]);
  });

  it('returns root nodes when parentId is null', () => {
    const nodes = [
      makeNode({ id: '1', name: 'A', parentId: null }),
      makeNode({ id: '2', name: 'B', parentId: null }),
    ];
    const result = buildTree(nodes, null);
    expect(result).toHaveLength(2);
    expect(result[0].children).toEqual([]);
  });

  it('nests child under correct parent', () => {
    const nodes = [
      makeNode({ id: '1', name: 'Root', parentId: null }),
      makeNode({ id: '2', name: 'Child', parentId: '1' }),
    ];
    const result = buildTree(nodes, null);
    expect(result).toHaveLength(1);
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].name).toBe('Child');
  });

  it('handles three levels of nesting', () => {
    const nodes = [
      makeNode({ id: '1', name: 'L1', parentId: null }),
      makeNode({ id: '2', name: 'L2', parentId: '1' }),
      makeNode({ id: '3', name: 'L3', parentId: '2' }),
    ];
    const result = buildTree(nodes, null);
    expect(result[0].children[0].children[0].name).toBe('L3');
  });

  it('assigns children to the correct parent when multiple roots exist', () => {
    const nodes = [
      makeNode({ id: '1', name: 'Root1', parentId: null }),
      makeNode({ id: '2', name: 'Root2', parentId: null }),
      makeNode({ id: '3', name: 'ChildOfRoot1', parentId: '1' }),
      makeNode({ id: '4', name: 'ChildOfRoot2', parentId: '2' }),
    ];
    const result = buildTree(nodes, null);
    expect(result).toHaveLength(2);
    const root1 = result.find((n: NodeEntity) => n.name === 'Root1')!;
    const root2 = result.find((n: NodeEntity) => n.name === 'Root2')!;
    expect(root1.children).toHaveLength(1);
    expect(root1.children[0].name).toBe('ChildOfRoot1');
    expect(root2.children).toHaveLength(1);
    expect(root2.children[0].name).toBe('ChildOfRoot2');
  });
});
