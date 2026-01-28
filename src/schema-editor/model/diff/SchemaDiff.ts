import { makeAutoObservable, observable } from 'mobx';
import type { SchemaTree } from '../tree/SchemaTree';
import type { JsonObjectSchema } from '../schema/JsonSchema';
import { SchemaSerializer } from '../schema/SchemaSerializer';
import type { SchemaPatch } from './SchemaPatch';
import { SchemaComparator } from './SchemaComparator';
import { NodePathIndex } from './index/NodePathIndex';
import { PatchBuilder } from './PatchBuilder';

export class SchemaDiff {
  private readonly serializer = new SchemaSerializer();
  private readonly comparator = new SchemaComparator();
  private readonly baseIndex: NodePathIndex;
  private baseTree: SchemaTree;

  constructor(private readonly tree: SchemaTree) {
    this.baseTree = tree.clone();
    this.baseIndex = new NodePathIndex(this.baseTree);
    makeAutoObservable<SchemaDiff, 'baseTree'>(
      this,
      { baseTree: observable.ref },
      { autoBind: true },
    );
  }

  public markAsSaved(): void {
    this.baseTree = this.tree.clone();
    this.baseIndex.rebuildFrom(this.baseTree);
  }

  public getBaseSchema(): JsonObjectSchema {
    return this.serializer.serializeWithTree(
      this.baseTree.root(),
      this.baseTree,
    ) as JsonObjectSchema;
  }

  public trackReplacement(oldNodeId: string, newNodeId: string): void {
    this.baseIndex.trackReplacement(oldNodeId, newNodeId);
  }

  public getPatches(): SchemaPatch[] {
    return this.createPatchBuilder().build();
  }

  public isDirty(): boolean {
    const currentSchema = this.getCurrentSchema();
    const baseSchema = this.getBaseSchema();
    return !this.comparator.areEqual(currentSchema, baseSchema);
  }

  public getCurrentSchema(): JsonObjectSchema {
    return this.serializer.serializeWithTree(
      this.tree.root(),
      this.tree,
    ) as JsonObjectSchema;
  }

  private createPatchBuilder(): PatchBuilder {
    return new PatchBuilder(this.tree, this.baseTree, this.baseIndex);
  }
}
