export type NodeType = 'folder' | 'file';

export interface Node {
  id: string;
  name: string;
  type: NodeType;
  parentId: string | null;
  path: string;
  size: number | null;
  extension: string | null;
  storageKey?: string | null;
  mimeType?: string | null;
  isTrashed?: boolean;
  trashedAt?: string | null;
  originalParentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NodeTree extends Node {
  children: NodeTree[];
}

export interface ApiResponse<T> {
  data: T;
}
