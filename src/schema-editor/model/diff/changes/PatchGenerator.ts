import type { SchemaNode } from '../../node/SchemaNode';
import type { SchemaTree } from '../../tree/SchemaTree';
import type { Path } from '../../path';
import { jsonPointerToPath } from '../../path';
import { SchemaSerializer } from '../../schema/SchemaSerializer';
import { SchemaComparator } from '../SchemaComparator';
import type { NodePathIndex } from '../index/NodePathIndex';
import type { JsonPatch } from '../SchemaPatch';
import type { RawChange } from './RawChange';
import type { CoalescedChanges } from './ChangeCoalescer';

export class PatchGenerator {
  private readonly serializer = new SchemaSerializer();
  private readonly comparator = new SchemaComparator();

  constructor(
    private readonly currentTree: SchemaTree,
    private readonly baseTree: SchemaTree,
    private readonly baseIndex: NodePathIndex,
  ) {}

  public generate(coalesced: CoalescedChanges): JsonPatch[] {
    const patches: JsonPatch[] = [];

    this.generateMovePatches(coalesced.moved, patches);

    const addPatches = this.generateAddPatches(coalesced.added);
    const removePatches = this.generateRemovePatches(coalesced.removed);

    const addRemovePaths = new Set([
      ...addPatches.map((p) => p.path),
      ...removePatches.map((p) => p.path),
    ]);

    this.generateReplacePatches(coalesced.modified, addRemovePaths, patches);

    patches.push(...addPatches, ...removePatches);

    return patches;
  }

  private generateMovePatches(moved: RawChange[], patches: JsonPatch[]): void {
    for (const change of moved) {
      if (!change.baseNode || !change.currentNode) {
        continue;
      }

      const basePath = this.baseTree.pathOf(change.baseNode.id());
      const currentPath = this.currentTree.pathOf(change.currentNode.id());

      patches.push({
        op: 'move',
        from: basePath.asJsonPointer(),
        path: currentPath.asJsonPointer(),
      });

      const modifyPatch = this.generateModifyAfterMove(
        change.baseNode,
        change.currentNode,
        currentPath.asJsonPointer(),
      );
      if (modifyPatch) {
        patches.push(modifyPatch);
      }
    }
  }

  private generateModifyAfterMove(
    baseNode: SchemaNode,
    currentNode: SchemaNode,
    currentPath: string,
  ): JsonPatch | null {
    const currentSchema = this.serializer.serializeWithTree(
      currentNode,
      this.currentTree,
    );
    const baseSchema = this.serializer.serializeWithTree(
      baseNode,
      this.baseTree,
    );

    if (!this.comparator.areEqual(currentSchema, baseSchema)) {
      return {
        op: 'replace',
        path: currentPath,
        value: currentSchema,
      };
    }

    return null;
  }

  private generateAddPatches(added: RawChange[]): JsonPatch[] {
    const patches: JsonPatch[] = [];

    for (const change of added) {
      if (!change.currentNode) {
        continue;
      }

      const currentPath = this.currentTree.pathOf(change.currentNode.id());
      const schema = this.serializer.serializeWithTree(
        change.currentNode,
        this.currentTree,
      );
      patches.push({
        op: 'add',
        path: currentPath.asJsonPointer(),
        value: schema,
      });
    }

    return patches;
  }

  private generateRemovePatches(removed: RawChange[]): JsonPatch[] {
    const patches: JsonPatch[] = [];

    for (const change of removed) {
      if (!change.baseNode) {
        continue;
      }

      const basePath = this.baseTree.pathOf(change.baseNode.id());
      patches.push({
        op: 'remove',
        path: basePath.asJsonPointer(),
      });
    }

    return patches;
  }

  private generateReplacePatches(
    modified: RawChange[],
    addRemovePaths: Set<string>,
    patches: JsonPatch[],
  ): void {
    const replacedPaths: Path[] = [];
    const addRemovePathObjects = [...addRemovePaths].map(jsonPointerToPath);

    for (const change of modified) {
      if (!change.currentNode || !change.baseNode) {
        continue;
      }

      const currentPath = this.currentTree.pathOf(change.currentNode.id());

      if (this.isChildOfAny(currentPath, replacedPaths)) {
        continue;
      }

      if (this.hasChildIn(currentPath, addRemovePathObjects)) {
        continue;
      }

      if (!this.isActuallyModified(change)) {
        continue;
      }

      const schema = this.serializer.serializeWithTree(
        change.currentNode,
        this.currentTree,
      );
      patches.push({
        op: 'replace',
        path: currentPath.asJsonPointer(),
        value: schema,
      });
      replacedPaths.push(currentPath);
    }
  }

  private isChildOfAny(path: Path, parents: Path[]): boolean {
    return parents.some((parent) => path.isChildOf(parent));
  }

  private hasChildIn(path: Path, candidates: Path[]): boolean {
    return candidates.some((candidate) => candidate.isChildOf(path));
  }

  private isActuallyModified(change: RawChange): boolean {
    if (!change.currentNode || !change.baseNode) {
      return false;
    }

    const currentSchema = this.serializer.serializeWithTree(
      change.currentNode,
      this.currentTree,
    );
    const baseSchema = this.serializer.serializeWithTree(
      change.baseNode,
      this.baseTree,
    );

    if (this.comparator.areEqual(currentSchema, baseSchema)) {
      return false;
    }

    if (
      change.currentNode.isObject() &&
      this.hasOnlyChildChanges(change.currentNode, change.baseNode)
    ) {
      return false;
    }

    if (
      change.currentNode.isArray() &&
      this.hasOnlyItemsChanges(change.currentNode, change.baseNode)
    ) {
      return false;
    }

    return true;
  }

  private hasOnlyChildChanges(
    currentNode: SchemaNode,
    baseNode: SchemaNode,
  ): boolean {
    if (!baseNode.isObject()) {
      return false;
    }

    const baseChildren = baseNode.properties();
    const currentChildren = currentNode.properties();

    for (const child of currentChildren) {
      if (!this.baseIndex.hasNode(child.id())) {
        return true;
      }
    }

    if (baseChildren.length !== currentChildren.length) {
      return true;
    }

    return false;
  }

  private hasOnlyItemsChanges(
    currentNode: SchemaNode,
    baseNode: SchemaNode,
  ): boolean {
    if (!baseNode.isArray()) {
      return false;
    }

    const items = currentNode.items();
    const baseItems = baseNode.items();

    if (items.isNull() || baseItems.isNull()) {
      return false;
    }

    return items.id() === baseItems.id();
  }
}
