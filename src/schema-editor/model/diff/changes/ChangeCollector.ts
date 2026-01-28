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

    this.collectCurrentTreeChanges(changes, processedBaseNodeIds);
    this.collectRemovedNodes(changes, processedBaseNodeIds);

    return changes;
  }

  private collectCurrentTreeChanges(
    changes: RawChange[],
    processedBaseNodeIds: Set<string>,
  ): void {
    for (const nodeId of this.currentTree.nodeIds()) {
      const currentPath = this.currentTree.pathOf(nodeId);
      const currentNode = this.currentTree.nodeById(nodeId);

      if (this.baseIndex.hasNode(nodeId)) {
        this.collectExistingNodeChange(
          nodeId,
          currentNode,
          currentPath,
          changes,
          processedBaseNodeIds,
        );
      } else {
        changes.push({
          type: 'added',
          baseNode: null,
          currentNode,
        });
      }
    }
  }

  private collectExistingNodeChange(
    nodeId: string,
    currentNode: ReturnType<SchemaTree['nodeById']>,
    currentPath: ReturnType<SchemaTree['pathOf']>,
    changes: RawChange[],
    processedBaseNodeIds: Set<string>,
  ): void {
    processedBaseNodeIds.add(nodeId);

    const originalNodeId = this.baseIndex.getOriginalNodeId(nodeId);
    const baseNodeId = originalNodeId ?? nodeId;
    const baseNode = this.baseTree.nodeById(baseNodeId);

    if (originalNodeId) {
      processedBaseNodeIds.add(originalNodeId);
    }

    const basePath = this.baseIndex.getPath(nodeId);
    const isMoved = !basePath || !currentPath.equals(basePath);

    changes.push({
      type: isMoved ? 'moved' : 'modified',
      baseNode,
      currentNode,
    });
  }

  private collectRemovedNodes(
    changes: RawChange[],
    processedBaseNodeIds: Set<string>,
  ): void {
    for (const nodeId of this.baseIndex.nodeIds()) {
      if (processedBaseNodeIds.has(nodeId)) {
        continue;
      }

      const baseNode = this.baseTree.nodeById(nodeId);
      changes.push({
        type: 'removed',
        baseNode,
        currentNode: null,
      });
    }
  }
}
