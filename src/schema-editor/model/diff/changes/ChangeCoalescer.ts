import type { Path } from '../../path/Path';
import type { SchemaTree } from '../../tree/SchemaTree';
import type { NodePathIndex } from '../index/NodePathIndex';
import type { RawChange } from './RawChange';

export interface CoalescedChanges {
  moved: RawChange[];
  added: RawChange[];
  removed: RawChange[];
  modified: RawChange[];
}

export class ChangeCoalescer {
  constructor(
    private readonly currentTree: SchemaTree,
    private readonly baseTree: SchemaTree,
    private readonly baseIndex: NodePathIndex,
  ) {}

  public coalesce(changes: RawChange[]): CoalescedChanges {
    const moved = changes.filter((c) => c.type === 'moved');
    const added = changes.filter((c) => c.type === 'added');
    const removed = changes.filter((c) => c.type === 'removed');
    const modified = changes.filter((c) => c.type === 'modified');

    const topLevelMoves = this.filterTopLevelMoves(moved);
    const movedBaseNodes = new Set(moved.map((c) => c.baseNode));
    const moveAffectedTopLevelNodeIds =
      this.collectMoveAffectedTopLevelNodeIds(topLevelMoves);

    return {
      moved: topLevelMoves,
      added: this.filterTopLevelAdds(added),
      removed: this.filterTopLevelRemoves(removed, movedBaseNodes),
      modified: this.filterModified(modified, moveAffectedTopLevelNodeIds),
    };
  }

  private collectMoveAffectedTopLevelNodeIds(
    topLevelMoves: RawChange[],
  ): Set<string> {
    const nodeIds = new Set<string>();
    for (const change of topLevelMoves) {
      if (change.baseNode) {
        const topLevelNodeId = this.getTopLevelNodeId(
          this.baseTree,
          change.baseNode.id(),
        );
        if (topLevelNodeId) {
          nodeIds.add(topLevelNodeId);
        }
      }
      if (change.currentNode) {
        const topLevelNodeId = this.getTopLevelNodeId(
          this.currentTree,
          change.currentNode.id(),
        );
        if (topLevelNodeId) {
          nodeIds.add(topLevelNodeId);
        }
      }
    }
    return nodeIds;
  }

  private getTopLevelNodeId(tree: SchemaTree, nodeId: string): string | null {
    const path = tree.pathOf(nodeId);
    const topLevelPath = path.getTopLevel();
    if (!topLevelPath) {
      return null;
    }
    const topLevelNode = tree.nodeAt(topLevelPath);
    return topLevelNode.isNull() ? null : topLevelNode.id();
  }

  private filterTopLevelMoves(moved: RawChange[]): RawChange[] {
    return moved.filter((change) => !this.isChildOfMovedPath(change, moved));
  }

  private isChildOfMovedPath(
    change: RawChange,
    allMoved: RawChange[],
  ): boolean {
    if (!change.baseNode) {
      return false;
    }
    const changeBaseNodeId = change.baseNode.id();
    const basePath = this.baseTree.pathOf(changeBaseNodeId);
    return allMoved.some(
      (other) =>
        other.baseNode &&
        other.baseNode.id() !== changeBaseNodeId &&
        basePath.isChildOf(this.baseTree.pathOf(other.baseNode.id())),
    );
  }

  private filterTopLevelAdds(added: RawChange[]): RawChange[] {
    const changesWithPaths = added
      .flatMap((change) => {
        if (!change.currentNode) {
          return [];
        }
        return [
          {
            change,
            path: this.currentTree.pathOf(change.currentNode.id()),
          },
        ];
      })
      .sort((a, b) => a.path.length() - b.path.length());

    const addedPaths: Path[] = [];
    const result: RawChange[] = [];

    for (const { change, path } of changesWithPaths) {
      if (this.baseIndex.isChildOfReplacedPath(path)) {
        continue;
      }

      if (this.isChildOfAnyPath(path, addedPaths)) {
        continue;
      }

      result.push(change);
      addedPaths.push(path);
    }

    return result;
  }

  private filterTopLevelRemoves(
    removed: RawChange[],
    movedBaseNodes: Set<RawChange['baseNode']>,
  ): RawChange[] {
    const changesWithPaths = removed
      .flatMap((change) => {
        if (!change.baseNode || movedBaseNodes.has(change.baseNode)) {
          return [];
        }
        return [
          {
            change,
            path: this.baseTree.pathOf(change.baseNode.id()),
          },
        ];
      })
      .sort((a, b) => a.path.length() - b.path.length());

    const removedPaths: Path[] = [];
    const result: RawChange[] = [];

    for (const { change, path } of changesWithPaths) {
      if (this.isChildOfAnyPath(path, removedPaths)) {
        continue;
      }

      result.push(change);
      removedPaths.push(path);
    }

    return result;
  }

  private filterModified(
    modified: RawChange[],
    moveAffectedTopLevelNodeIds: Set<string>,
  ): RawChange[] {
    return modified.filter((change) => {
      if (!change.currentNode) {
        return false;
      }

      const topLevelNodeId = this.getTopLevelNodeId(
        this.currentTree,
        change.currentNode.id(),
      );
      if (topLevelNodeId && moveAffectedTopLevelNodeIds.has(topLevelNodeId)) {
        return false;
      }

      return true;
    });
  }

  private isChildOfAnyPath(path: Path, parents: Path[]): boolean {
    for (const parent of parents) {
      if (path.isChildOf(parent)) {
        return true;
      }
    }
    return false;
  }
}
