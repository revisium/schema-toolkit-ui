import type { SchemaTree } from '../../tree/SchemaTree';
import type { NodePathIndex } from '../index/NodePathIndex';
import type { RawChange } from './RawChange';

export class ChangeCollector {
  constructor(
    private readonly currentTree: SchemaTree,
    private readonly baseTree: SchemaTree,
    private readonly baseIndex: NodePathIndex,
  ) {}

  public collect(): RawChange[] {
    const changes: RawChange[] = [];
    const processedBaseNodeIds = new Set<string>();

    for (const nodeId of this.currentTree.nodeIds()) {
      const currentPath = this.currentTree.pathOf(nodeId);
      if (currentPath.isEmpty()) {
        continue;
      }

      const currentNode = this.currentTree.nodeById(nodeId);
      const hasInBase = this.baseIndex.hasNode(nodeId);

      if (!hasInBase) {
        changes.push({
          type: 'added',
          baseNode: null,
          currentNode,
        });
      } else {
        processedBaseNodeIds.add(nodeId);

        const originalNodeId = this.baseIndex.getOriginalNodeId(nodeId);
        const baseNodeId = originalNodeId ?? nodeId;
        const baseNode = this.baseTree.nodeById(baseNodeId);

        if (originalNodeId) {
          processedBaseNodeIds.add(originalNodeId);
        }

        const basePath = this.baseIndex.getPath(nodeId);

        if (!basePath || !currentPath.equals(basePath)) {
          changes.push({
            type: 'moved',
            baseNode,
            currentNode,
          });
        } else {
          changes.push({
            type: 'modified',
            baseNode,
            currentNode,
          });
        }
      }
    }

    for (const nodeId of this.baseIndex.nodeIds()) {
      if (!processedBaseNodeIds.has(nodeId)) {
        const baseNode = this.baseTree.nodeById(nodeId);
        changes.push({
          type: 'removed',
          baseNode,
          currentNode: null,
        });
      }
    }

    return changes;
  }
}
