import type { INodeRepository } from '../domain/repositories/node.repository.interface';
import type { NodeEntity, NodeTree } from '../domain/entities/node.entity';

export class NodeService {
  constructor(private readonly nodeRepository: INodeRepository) {}

  async getTree(): Promise<NodeTree[]> {
    return this.nodeRepository.findTree();
  }

  async getChildren(parentId: string): Promise<NodeEntity[]> {
    const parent = await this.nodeRepository.findById(parentId);
    if (!parent) throw new Error(`Node ${parentId} not found`);
    return this.nodeRepository.findChildren(parentId);
  }

  async search(query: string): Promise<NodeEntity[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    return this.nodeRepository.search(trimmed);
  }

  async getById(id: string): Promise<NodeEntity | null> {
    return this.nodeRepository.findById(id);
  }
}
