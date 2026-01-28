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
    const moveAffectedTopLevelPaths =
      this.collectMoveAffectedTopLevelPaths(topLevelMoves);

    return {
      moved: topLevelMoves,
      added: this.filterTopLevelAdds(added),
      removed: this.filterTopLevelRemoves(removed, movedBaseNodes),
      modified: this.filterModified(modified, moveAffectedTopLevelPaths),
    };
  }

  private collectMoveAffectedTopLevelPaths(
    topLevelMoves: RawChange[],
  ): Set<string> {
    const paths = new Set<string>();
    for (const change of topLevelMoves) {
      if (change.baseNode) {
        const basePath = this.baseTree.pathOf(change.baseNode.id());
        const topLevel = basePath.getTopLevel();
        if (topLevel) {
          paths.add(topLevel.asJsonPointer());
        }
      }
      if (change.currentNode) {
        const currentPath = this.currentTree.pathOf(change.currentNode.id());
        const topLevel = currentPath.getTopLevel();
        if (topLevel) {
          paths.add(topLevel.asJsonPointer());
        }
      }
    }
    return paths;
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
    const addedPaths: Path[] = [];
    const result: RawChange[] = [];

    for (const change of added) {
      if (!change.currentNode) {
        continue;
      }

      const currentPath = this.currentTree.pathOf(change.currentNode.id());

      if (this.baseIndex.isChildOfReplacedPath(currentPath)) {
        continue;
      }

      if (this.isChildOfAnyPath(currentPath, addedPaths)) {
        continue;
      }

      result.push(change);
      addedPaths.push(currentPath);
    }

    return result;
  }

  private filterTopLevelRemoves(
    removed: RawChange[],
    movedBaseNodes: Set<RawChange['baseNode']>,
  ): RawChange[] {
    const removedPaths: Path[] = [];
    const result: RawChange[] = [];

    for (const change of removed) {
      if (!change.baseNode) {
        continue;
      }

      if (movedBaseNodes.has(change.baseNode)) {
        continue;
      }

      const basePath = this.baseTree.pathOf(change.baseNode.id());

      if (this.isChildOfAnyPath(basePath, removedPaths)) {
        continue;
      }

      result.push(change);
      removedPaths.push(basePath);
    }

    return result;
  }

  private filterModified(
    modified: RawChange[],
    moveAffectedTopLevelPaths: Set<string>,
  ): RawChange[] {
    return modified.filter((change) => {
      if (!change.currentNode) {
        return false;
      }

      const currentPath = this.currentTree.pathOf(change.currentNode.id());
      const topLevel = currentPath.getTopLevel();
      if (topLevel && moveAffectedTopLevelPaths.has(topLevel.asJsonPointer())) {
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
