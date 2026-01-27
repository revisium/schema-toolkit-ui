import type { SchemaNode } from '../node/SchemaNode';
import type { SchemaTree } from '../tree/SchemaTree';
import type { JsonObjectSchema } from '../schema/JsonSchema';
import { SchemaSerializer } from '../schema/SchemaSerializer';
import type { NodePathIndex } from './NodePathIndex';
import type { SchemaNavigator } from './SchemaNavigator';
import type { SchemaComparator } from './SchemaComparator';
import type { JsonPatch } from './SchemaDiff';

interface MovedNode {
  nodeId: string;
  from: string;
  to: string;
}

interface PatchContext {
  currentNodeIdToPath: Map<string, string>;
  serializer: SchemaSerializer;
  processedNodeIds: Set<string>;
  movedFromPaths: Set<string>;
  moveAffectedTopLevelPaths: Set<string>;
}

export class PatchBuilder {
  constructor(
    private readonly tree: SchemaTree,
    private readonly baseIndex: NodePathIndex,
    private readonly navigator: SchemaNavigator,
    private readonly comparator: SchemaComparator,
    private readonly baseSchema: JsonObjectSchema,
  ) {}

  public build(): JsonPatch[] {
    const context = this.createPatchContext();
    const patches: JsonPatch[] = [];

    const movedNodes = this.detectMovedNodes(context);
    this.buildMovePatches(movedNodes, context, patches);

    const addPatches: JsonPatch[] = [];
    const removePatches: JsonPatch[] = [];
    this.buildAddPatches(context, addPatches);
    this.buildRemovePatches(context, removePatches);

    const addRemovePaths = new Set([
      ...addPatches.map((p) => p.path),
      ...removePatches.map((p) => p.path),
    ]);

    this.buildReplacePatches(context, patches, addRemovePaths);
    patches.push(...addPatches, ...removePatches);

    return patches;
  }

  private createPatchContext(): PatchContext {
    return {
      currentNodeIdToPath: this.baseIndex.buildCurrentIndex(),
      serializer: new SchemaSerializer(),
      processedNodeIds: new Set<string>(),
      movedFromPaths: new Set<string>(),
      moveAffectedTopLevelPaths: new Set<string>(),
    };
  }

  private detectMovedNodes(context: PatchContext): MovedNode[] {
    const movedNodes: MovedNode[] = [];

    for (const [nodeId, currentPath] of context.currentNodeIdToPath) {
      const basePath = this.baseIndex.getPath(nodeId);
      if (basePath === undefined) {
        continue;
      }

      context.processedNodeIds.add(nodeId);
      if (basePath !== currentPath) {
        movedNodes.push({ nodeId, from: basePath, to: currentPath });
      }
    }

    return movedNodes;
  }

  private buildMovePatches(
    movedNodes: MovedNode[],
    context: PatchContext,
    patches: JsonPatch[],
  ): void {
    for (const moved of movedNodes) {
      if (this.isChildOfMovedNode(moved, movedNodes)) {
        context.movedFromPaths.add(moved.from);
        continue;
      }

      const node = this.tree.nodeById(moved.nodeId);
      if (node.isNull()) {
        continue;
      }

      patches.push({ op: 'move', from: moved.from, path: moved.to });

      const modifyPatch = this.buildModifyPatchAfterMove(moved, node, context);
      if (modifyPatch) {
        patches.push(modifyPatch);
      }

      context.movedFromPaths.add(moved.from);
      this.trackAffectedTopLevelPaths(moved, context);
    }
  }

  private isChildOfMovedNode(
    moved: MovedNode,
    allMovedNodes: MovedNode[],
  ): boolean {
    return allMovedNodes.some(
      (other) =>
        other.nodeId !== moved.nodeId &&
        moved.from.startsWith(other.from + '/'),
    );
  }

  private buildModifyPatchAfterMove(
    moved: MovedNode,
    node: SchemaNode,
    context: PatchContext,
  ): JsonPatch | null {
    const currentSchema = context.serializer.serialize(node);
    const baseSchema = this.navigator.getSchemaAtPath(
      this.baseSchema,
      moved.from,
    );
    const isModified =
      baseSchema && !this.comparator.areEqual(currentSchema, baseSchema);

    if (isModified) {
      return { op: 'replace', path: moved.to, value: currentSchema };
    }
    return null;
  }

  private trackAffectedTopLevelPaths(
    moved: MovedNode,
    context: PatchContext,
  ): void {
    const fromTopLevel = this.navigator.getTopLevelPath(moved.from);
    const toTopLevel = this.navigator.getTopLevelPath(moved.to);

    if (fromTopLevel) {
      context.moveAffectedTopLevelPaths.add(fromTopLevel);
    }
    if (toTopLevel) {
      context.moveAffectedTopLevelPaths.add(toTopLevel);
    }
  }

  private buildReplacePatches(
    context: PatchContext,
    patches: JsonPatch[],
    addRemovePaths: Set<string>,
  ): void {
    const replacedPaths = new Set<string>();

    for (const [nodeId, currentPath] of context.currentNodeIdToPath) {
      const basePath = this.baseIndex.getPath(nodeId);
      if (basePath === undefined || basePath !== currentPath) {
        continue;
      }

      if (
        context.moveAffectedTopLevelPaths.has(
          this.navigator.getTopLevelPath(currentPath) ?? '',
        )
      ) {
        continue;
      }

      if (this.isChildOfReplacedPath(currentPath, replacedPaths)) {
        continue;
      }

      if (this.hasChildAddRemovePatches(currentPath, addRemovePaths)) {
        continue;
      }

      if (this.isNodeDirectlyModified(nodeId, basePath, context)) {
        const node = this.tree.nodeById(nodeId);
        if (!node.isNull()) {
          const currentSchema = context.serializer.serialize(node);
          patches.push({
            op: 'replace',
            path: currentPath,
            value: currentSchema,
          });
          replacedPaths.add(currentPath);
        }
      }
    }
  }

  private hasChildAddRemovePatches(
    path: string,
    addRemovePaths: Set<string>,
  ): boolean {
    for (const addRemovePath of addRemovePaths) {
      if (addRemovePath.startsWith(path + '/')) {
        return true;
      }
    }
    return false;
  }

  private isChildOfReplacedPath(
    path: string,
    replacedPaths: Set<string>,
  ): boolean {
    for (const replacedPath of replacedPaths) {
      if (path.startsWith(replacedPath + '/')) {
        return true;
      }
    }
    return false;
  }

  private isNodeDirectlyModified(
    nodeId: string,
    basePath: string,
    context: PatchContext,
  ): boolean {
    const node = this.tree.nodeById(nodeId);
    if (node.isNull()) {
      return false;
    }

    const currentSchema = context.serializer.serialize(node);
    const baseSchema = this.navigator.getSchemaAtPath(
      this.baseSchema,
      basePath,
    );

    if (baseSchema === null) {
      return false;
    }

    if (this.comparator.areEqual(currentSchema, baseSchema)) {
      return false;
    }

    if (node.isObject() && this.hasOnlyChildChanges(node, basePath)) {
      return false;
    }

    if (node.isArray() && this.hasOnlyItemsChanges(node, basePath)) {
      return false;
    }

    return true;
  }

  private hasOnlyItemsChanges(node: SchemaNode, basePath: string): boolean {
    const baseSchema = this.navigator.getSchemaAtPath(
      this.baseSchema,
      basePath,
    );
    if (
      !baseSchema ||
      typeof baseSchema !== 'object' ||
      !('items' in baseSchema)
    ) {
      return false;
    }

    const items = node.items();
    if (items.isNull()) {
      return false;
    }

    const itemsPath = `${basePath}/items`;
    const itemsBasePath = this.baseIndex.getPath(items.id());

    return itemsBasePath === itemsPath;
  }

  private hasOnlyChildChanges(node: SchemaNode, basePath: string): boolean {
    const baseSchema = this.navigator.getSchemaAtPath(
      this.baseSchema,
      basePath,
    );
    if (
      !baseSchema ||
      typeof baseSchema !== 'object' ||
      !('properties' in baseSchema)
    ) {
      return false;
    }

    const baseProps = baseSchema.properties || {};
    const currentChildren = node.children();

    for (const child of currentChildren) {
      const childBasePath = `${basePath}/properties/${child.name()}`;
      if (!this.baseIndex.hasNode(child.id())) {
        return true;
      }
      const childBaseSchema = this.navigator.getSchemaAtPath(
        this.baseSchema,
        childBasePath,
      );
      if (childBaseSchema === null) {
        return true;
      }
    }

    const baseChildNames = Object.keys(baseProps);
    const currentChildNames = currentChildren.map((c) => c.name());
    if (baseChildNames.length !== currentChildNames.length) {
      return true;
    }

    return false;
  }

  private buildAddPatches(context: PatchContext, patches: JsonPatch[]): void {
    const addedPaths = new Set<string>();

    for (const [nodeId, currentPath] of context.currentNodeIdToPath) {
      const isNewNode =
        !context.processedNodeIds.has(nodeId) &&
        !this.baseIndex.hasNode(nodeId);
      if (!isNewNode) {
        continue;
      }

      if (this.baseIndex.isChildOfReplacedPath(currentPath)) {
        context.processedNodeIds.add(nodeId);
        continue;
      }

      if (this.isChildOfAddedPath(currentPath, addedPaths)) {
        context.processedNodeIds.add(nodeId);
        continue;
      }

      const node = this.tree.nodeById(nodeId);
      if (node.isNull()) {
        continue;
      }

      const currentSchema = context.serializer.serialize(node);
      patches.push({ op: 'add', path: currentPath, value: currentSchema });
      context.processedNodeIds.add(nodeId);
      addedPaths.add(currentPath);
    }
  }

  private isChildOfAddedPath(path: string, addedPaths: Set<string>): boolean {
    for (const addedPath of addedPaths) {
      if (path.startsWith(addedPath + '/')) {
        return true;
      }
    }
    return false;
  }

  private buildRemovePatches(
    context: PatchContext,
    patches: JsonPatch[],
  ): void {
    const removedPaths = new Set<string>();

    for (const [nodeId, basePath] of this.baseIndex.entries()) {
      const isRemoved =
        !context.currentNodeIdToPath.has(nodeId) &&
        !context.movedFromPaths.has(basePath);
      if (!isRemoved) {
        continue;
      }

      if (this.isChildOfRemovedPath(basePath, removedPaths)) {
        continue;
      }

      patches.push({ op: 'remove', path: basePath });
      removedPaths.add(basePath);
    }
  }

  private isChildOfRemovedPath(
    path: string,
    removedPaths: Set<string>,
  ): boolean {
    for (const removedPath of removedPaths) {
      if (path.startsWith(removedPath + '/')) {
        return true;
      }
    }
    return false;
  }
}
