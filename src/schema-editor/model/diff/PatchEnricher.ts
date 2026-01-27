import type { JsonSchemaType, JsonObjectSchema } from '../schema/JsonSchema';
import type { SchemaNavigator } from './SchemaNavigator';
import type { JsonPatch } from './SchemaDiff';
import {
  type RichPatch,
  getFieldNameFromPath,
  isRenameMove,
  movesIntoArrayBoundary,
  computeMetadataChanges,
  hasTypeChanged,
  getSchemaType,
} from './RichPatch';

export class PatchEnricher {
  constructor(
    private readonly navigator: SchemaNavigator,
    private readonly baseSchema: JsonObjectSchema,
  ) {}

  public enrich(patches: JsonPatch[]): RichPatch[] {
    return patches.map((patch) => this.enrichPatch(patch));
  }

  private enrichPatch(patch: JsonPatch): RichPatch {
    const fieldName = getFieldNameFromPath(patch.path);

    if (patch.op === 'add' || patch.op === 'remove') {
      return { patch, fieldName, metadataChanges: [] };
    }

    if (patch.op === 'move') {
      return this.enrichMovePatch(patch, fieldName);
    }

    return this.enrichReplacePatch(patch, fieldName);
  }

  private enrichMovePatch(patch: JsonPatch, fieldName: string): RichPatch {
    const fromPath = patch.from || '';
    const isRename = isRenameMove(fromPath, patch.path);
    const movesIntoArray = movesIntoArrayBoundary(fromPath, patch.path);

    return {
      patch,
      fieldName,
      metadataChanges: [],
      isRename: isRename || undefined,
      movesIntoArray: movesIntoArray || undefined,
    };
  }

  private enrichReplacePatch(patch: JsonPatch, fieldName: string): RichPatch {
    const baseSchema = this.getBaseSchemaAtPath(patch.path);
    const currentSchema = patch.value || null;

    const {
      metadataChanges,
      formulaChange,
      defaultChange,
      descriptionChange,
      deprecatedChange,
    } = computeMetadataChanges(baseSchema, currentSchema);
    const typeChanged = hasTypeChanged(baseSchema, currentSchema);

    return {
      patch,
      fieldName,
      metadataChanges,
      typeChange: typeChanged
        ? {
            fromType: getSchemaType(baseSchema),
            toType: getSchemaType(currentSchema),
          }
        : undefined,
      formulaChange,
      defaultChange,
      descriptionChange,
      deprecatedChange,
    };
  }

  private getBaseSchemaAtPath(path: string): JsonSchemaType | null {
    return this.navigator.getSchemaAtPath(this.baseSchema, path);
  }
}
