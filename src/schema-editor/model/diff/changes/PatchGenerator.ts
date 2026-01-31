import type { SchemaNode } from '../../node/SchemaNode';
import type { SchemaTree } from '../../tree/SchemaTree';
import type { Path } from '../../path';
import { jsonPointerToPath } from '../../path';
import { SchemaSerializer } from '../../schema/SchemaSerializer';
import { SchemaComparator } from '../SchemaComparator';
import type { JsonPatch } from '../SchemaPatch';
import type { RawChange } from './RawChange';
import type { CoalescedChanges } from './ChangeCoalescer';

export class PatchGenerator {
  private readonly serializer = new SchemaSerializer();
  private readonly comparator = new SchemaComparator();

  constructor(
    private readonly currentTree: SchemaTree,
    private readonly baseTree: SchemaTree,
  ) {}

  public generate(coalesced: CoalescedChanges): JsonPatch[] {
    const movedNodeIds = this.collectMovedNodeIds(coalesced.moved);
    const movePatches = this.generateMovePatches(coalesced.moved);
    const addPatches = this.generateAddPatches(coalesced.added, movedNodeIds);
    const removePatches = this.generateRemovePatches(coalesced.removed);

    const { prerequisiteAdds, regularAdds } = this.partitionAddPatches(
      addPatches,
      movePatches,
    );

    const childChangePaths = new Set([
      ...addPatches.map((p) => p.path),
      ...removePatches.map((p) => p.path),
      ...movePatches.flatMap((p) => [p.path, p.from ?? '']).filter(Boolean),
    ]);

    const replacePatches = this.generateReplacePatches(
      coalesced.modified,
      childChangePaths,
    );

    return [
      ...prerequisiteAdds,
      ...movePatches,
      ...replacePatches,
      ...regularAdds,
      ...removePatches,
    ];
  }

  private collectMovedNodeIds(moved: RawChange[]): Set<string> {
    const nodeIds = new Set<string>();
    for (const change of moved) {
      if (change.currentNode) {
        nodeIds.add(change.currentNode.id());
      }
    }
    return nodeIds;
  }

  private partitionAddPatches(
    addPatches: JsonPatch[],
    movePatches: JsonPatch[],
  ): { prerequisiteAdds: JsonPatch[]; regularAdds: JsonPatch[] } {
    const moveDestinations = movePatches.map((p) => jsonPointerToPath(p.path));

    const prerequisiteAdds: JsonPatch[] = [];
    const regularAdds: JsonPatch[] = [];

    for (const addPatch of addPatches) {
      const addPath = jsonPointerToPath(addPatch.path);
      const isPrerequisite = moveDestinations.some((moveDest) =>
        moveDest.isChildOf(addPath),
      );

      if (isPrerequisite) {
        prerequisiteAdds.push(addPatch);
      } else {
        regularAdds.push(addPatch);
      }
    }

    return { prerequisiteAdds, regularAdds };
  }

  private generateMovePatches(moved: RawChange[]): JsonPatch[] {
    const patches: JsonPatch[] = [];

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

    return patches;
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

  private generateAddPatches(
    added: RawChange[],
    movedNodeIds: Set<string>,
  ): JsonPatch[] {
    const patches: JsonPatch[] = [];

    for (const change of added) {
      if (!change.currentNode) {
        continue;
      }

      const currentPath = this.currentTree.pathOf(change.currentNode.id());
      const schema = this.serializer.serializeWithTree(
        change.currentNode,
        this.currentTree,
        { excludeNodeIds: movedNodeIds },
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
    childChangePaths: Set<string>,
  ): JsonPatch[] {
    const patches: JsonPatch[] = [];
    const replacedPaths: Path[] = [];
    const childChangePathObjects = [...childChangePaths].map(jsonPointerToPath);

    for (const change of modified) {
      if (!change.currentNode || !change.baseNode) {
        continue;
      }

      const currentPath = this.currentTree.pathOf(change.currentNode.id());

      if (this.isChildOfAny(currentPath, replacedPaths)) {
        continue;
      }

      if (this.hasChildIn(currentPath, childChangePathObjects)) {
        continue;
      }

      if (!this.isActuallyModified(change)) {
        continue;
      }

      if (change.currentNode.isArray()) {
        const arrayPatches = this.generateArrayReplacePatches(
          change.currentNode,
          change.baseNode,
          currentPath,
        );
        patches.push(...arrayPatches);
        replacedPaths.push(currentPath);
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

    return patches;
  }

  private generateArrayReplacePatches(
    currentNode: SchemaNode,
    baseNode: SchemaNode,
    currentPath: Path,
  ): JsonPatch[] {
    if (!baseNode.isArray()) {
      const schema = this.serializer.serializeWithTree(
        currentNode,
        this.currentTree,
      );
      return [
        {
          op: 'replace',
          path: currentPath.asJsonPointer(),
          value: schema,
        },
      ];
    }

    const patches: JsonPatch[] = [];
    const metadataChanged = this.hasMetadataChanged(currentNode, baseNode);
    const itemsChanged = this.hasItemsChanged(currentNode, baseNode);

    if (metadataChanged) {
      const schema = this.serializer.serializeWithTree(
        currentNode,
        this.currentTree,
      );
      patches.push({
        op: 'replace',
        path: currentPath.asJsonPointer(),
        value: schema,
      });
    }

    if (itemsChanged) {
      const items = currentNode.items();
      if (!items.isNull()) {
        const itemsPath = currentPath.childItems();
        const itemsSchema = this.serializer.serializeWithTree(
          items,
          this.currentTree,
        );
        patches.push({
          op: 'replace',
          path: itemsPath.asJsonPointer(),
          value: itemsSchema,
        });
      }
    }

    return patches;
  }

  private hasItemsChanged(
    currentNode: SchemaNode,
    baseNode: SchemaNode,
  ): boolean {
    const items = currentNode.items();
    const baseItems = baseNode.items();

    if (items.isNull() && baseItems.isNull()) {
      return false;
    }
    if (items.isNull() || baseItems.isNull()) {
      return true;
    }

    const currentItemsSchema = this.serializer.serializeWithTree(
      items,
      this.currentTree,
    );
    const baseItemsSchema = this.serializer.serializeWithTree(
      baseItems,
      this.baseTree,
    );

    return !this.comparator.areEqual(currentItemsSchema, baseItemsSchema);
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

    if (this.hasMetadataChanged(currentNode, baseNode)) {
      return false;
    }

    return true;
  }

  private hasMetadataChanged(
    currentNode: SchemaNode,
    baseNode: SchemaNode,
  ): boolean {
    const currentMeta = currentNode.metadata();
    const baseMeta = baseNode.metadata();

    return (
      currentMeta.title !== baseMeta.title ||
      currentMeta.description !== baseMeta.description ||
      currentMeta.deprecated !== baseMeta.deprecated
    );
  }

  private hasOnlyItemsChanges(
    currentNode: SchemaNode,
    baseNode: SchemaNode,
  ): boolean {
    if (!baseNode.isArray()) {
      return false;
    }

    if (this.hasMetadataChanged(currentNode, baseNode)) {
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
