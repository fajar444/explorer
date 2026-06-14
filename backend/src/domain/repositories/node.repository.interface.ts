import type { NodeEntity, NodeTree } from '../entities/node.entity';

export interface CreateNodeData {
  name: string;
  type: 'folder' | 'file';
  parentId: string | null;
  path: string;
  size: number | null;
  extension: string | null;
  storageKey: string | null;
  mimeType: string | null;
}

export interface UpdateNodeData {
  name?: string;
  parentId?: string | null;
  path?: string;
  isTrashed?: boolean;
  trashedAt?: Date | null;
  originalParentId?: string | null;
}

export interface INodeRepository {
  findById(id: string): Promise<NodeEntity | null>;
  findChildren(parentId: string | null): Promise<NodeEntity[]>;
  findTree(): Promise<NodeTree[]>;
  search(query: string): Promise<NodeEntity[]>;
  findTrashed(): Promise<NodeEntity[]>;
  findByParentAndName(parentId: string | null, name: string): Promise<NodeEntity | null>;
  findSubtree(rootId: string): Promise<NodeEntity[]>;

  create(data: CreateNodeData): Promise<NodeEntity>;
  update(id: string, patch: UpdateNodeData): Promise<NodeEntity>;
  hardDelete(ids: string[]): Promise<NodeEntity[]>;
}
