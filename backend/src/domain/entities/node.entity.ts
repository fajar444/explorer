export type NodeType = 'folder' | 'file';

export interface NodeEntity {
  id: string;
  name: string;
  type: NodeType;
  parentId: string | null;
  path: string;
  size: number | null;
  extension: string | null;
  storageKey: string | null;
  mimeType: string | null;
  isTrashed: boolean;
  trashedAt: Date | null;
  originalParentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NodeTree extends NodeEntity {
  children: NodeTree[];
}
