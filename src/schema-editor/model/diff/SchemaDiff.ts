import type { SchemaTree } from '../tree/SchemaTree';
import type { JsonSchemaType, JsonObjectSchema } from '../schema/JsonSchema';
import { SchemaSerializer } from '../schema/SchemaSerializer';
import type { RichPatch } from './RichPatch';
import { SchemaComparator } from './SchemaComparator';
import { NodePathIndex } from './NodePathIndex';
import { PatchBuilder } from './PatchBuilder';
import { PatchEnricher } from './PatchEnricher';

export interface JsonPatch {
  op: 'add' | 'remove' | 'replace' | 'move';
  path: string;
  from?: string;
  value?: JsonSchemaType;
}

export class SchemaDiff {
  private readonly comparator: SchemaComparator;
  private readonly baseIndex: NodePathIndex;
  private baseSchema: JsonObjectSchema;

  constructor(
    private readonly tree: SchemaTree,
    baseSchema: JsonObjectSchema,
  ) {
    this.baseSchema = baseSchema;
    this.comparator = new SchemaComparator();
    this.baseIndex = new NodePathIndex(tree);
  }

  public markAsSaved(newBaseSchema: JsonObjectSchema): void {
    this.baseSchema = newBaseSchema;
    this.baseIndex.rebuild();
  }

  public getBaseSchema(): JsonObjectSchema {
    return this.baseSchema;
  }

  public trackReplacement(oldNodeId: string, newNodeId: string): void {
    this.baseIndex.trackReplacement(oldNodeId, newNodeId);
  }

  public getPatches(): JsonPatch[] {
    return this.createPatchBuilder().build();
  }

  public getRichPatches(): RichPatch[] {
    const patches = this.getPatches();
    return this.createPatchEnricher().enrich(patches);
  }

  public isDirty(): boolean {
    const currentSchema = this.getCurrentSchema();
    return !this.comparator.areEqual(currentSchema, this.baseSchema);
  }

  public getCurrentSchema(): JsonObjectSchema {
    const serializer = new SchemaSerializer();
    return serializer.serialize(this.tree.root()) as JsonObjectSchema;
  }

  private createPatchBuilder(): PatchBuilder {
    return new PatchBuilder(
      this.tree,
      this.baseIndex,
      this.comparator,
      this.baseSchema,
    );
  }

  private createPatchEnricher(): PatchEnricher {
    return new PatchEnricher(this.baseSchema);
  }
}
