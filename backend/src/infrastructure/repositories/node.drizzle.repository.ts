import { eq, isNull, ilike, asc, and, inArray, sql } from 'drizzle-orm';
import type { DB } from '../database/connection';
import { nodes, type NodeSelect } from '../database/schema';
import type {
  INodeRepository,
  CreateNodeData,
  UpdateNodeData,
} from '../../domain/repositories/node.repository.interface';
import type { NodeEntity, NodeTree } from '../../domain/entities/node.entity';

export class NodeDrizzleRepository implements INodeRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<NodeEntity | null> {
    const [row] = await this.db.select().from(nodes).where(eq(nodes.id, id)).limit(1);
    return row ? this.mapToEntity(row) : null;
  }

  async findChildren(parentId: string | null): Promise<NodeEntity[]> {
    const parentCond = parentId !== null ? eq(nodes.parentId, parentId) : isNull(nodes.parentId);
    const rows = await this.db
      .select()
      .from(nodes)
      .where(and(parentCond, eq(nodes.isTrashed, false)))
      .orderBy(sql`CASE WHEN ${nodes.type} = 'folder' THEN 0 ELSE 1 END`, asc(nodes.name));
    return rows.map((row) => this.mapToEntity(row));
  }

  async findTree(): Promise<NodeTree[]> {
    const allFolders = await this.db
      .select()
      .from(nodes)
      .where(and(eq(nodes.type, 'folder'), eq(nodes.isTrashed, false)))
      .orderBy(asc(nodes.name));
    return this.buildTree(allFolders.map((row) => this.mapToEntity(row)), null);
  }

  async search(query: string): Promise<NodeEntity[]> {
    const rows = await this.db
      .select()
      .from(nodes)
      .where(and(ilike(nodes.name, `%${query}%`), eq(nodes.isTrashed, false)))
      .orderBy(sql`CASE WHEN ${nodes.type} = 'folder' THEN 0 ELSE 1 END`, asc(nodes.name))
      .limit(50);
    return rows.map((row) => this.mapToEntity(row));
  }

  async findTrashed(): Promise<NodeEntity[]> {
    const rows = await this.db
      .select()
      .from(nodes)
      .where(eq(nodes.isTrashed, true))
      .orderBy(sql`${nodes.trashedAt} DESC NULLS LAST`, asc(nodes.name));
    return rows.map((row) => this.mapToEntity(row));
  }

  async findByParentAndName(parentId: string | null, name: string): Promise<NodeEntity | null> {
    const parentCond = parentId !== null ? eq(nodes.parentId, parentId) : isNull(nodes.parentId);
    const [row] = await this.db
      .select()
      .from(nodes)
      .where(and(parentCond, eq(nodes.name, name), eq(nodes.isTrashed, false)))
      .limit(1);
    return row ? this.mapToEntity(row) : null;
  }

  async findSubtree(rootId: string): Promise<NodeEntity[]> {
    const root = await this.findById(rootId);
    if (!root) return [];
    const out: NodeEntity[] = [root];
    let frontier: string[] = [rootId];
    while (frontier.length > 0) {
      const rows = await this.db.select().from(nodes).where(inArray(nodes.parentId, frontier));
      const ents = rows.map((row) => this.mapToEntity(row));
      out.push(...ents);
      frontier = ents.map((e) => e.id);
    }
    return out;
  }

  async create(data: CreateNodeData): Promise<NodeEntity> {
    const [row] = await this.db.insert(nodes).values(data).returning();
    return this.mapToEntity(row);
  }

  async update(id: string, patch: UpdateNodeData): Promise<NodeEntity> {
    const [row] = await this.db
      .update(nodes)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(nodes.id, id))
      .returning();
    return this.mapToEntity(row);
  }

  async hardDelete(ids: string[]): Promise<NodeEntity[]> {
    if (ids.length === 0) return [];
    const rows = await this.db.delete(nodes).where(inArray(nodes.id, ids)).returning();
    return rows.map((row) => this.mapToEntity(row));
  }

  private buildTree(nodeList: NodeEntity[], parentId: string | null): NodeTree[] {
    return nodeList
      .filter((n) => n.parentId === parentId)
      .map((node) => ({ ...node, children: this.buildTree(nodeList, node.id) }));
  }

  private mapToEntity(row: NodeSelect): NodeEntity {
    return {
      id: row.id,
      name: row.name,
      type: row.type as 'folder' | 'file',
      parentId: row.parentId ?? null,
      path: row.path,
      size: row.size ?? null,
      extension: row.extension ?? null,
      storageKey: row.storageKey ?? null,
      mimeType: row.mimeType ?? null,
      isTrashed: row.isTrashed,
      trashedAt: row.trashedAt ?? null,
      originalParentId: row.originalParentId ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
