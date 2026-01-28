import type { JsonSchemaType } from '../schema/JsonSchema';
import { PathUtils } from '../path/PathUtils';
import { SchemaMetadataExtractor } from './SchemaMetadataExtractor';

export type {
  RichPatch,
  MetadataChangeType,
  DefaultValueType,
  MetadataChangesResult,
} from './RichPatchTypes';

const metadataExtractor = new SchemaMetadataExtractor();

export function getSchemaType(schema: JsonSchemaType | null): string {
  return metadataExtractor.getSchemaType(schema);
}

export function getFieldNameFromPath(jsonPointer: string): string {
  try {
    const path = PathUtils.jsonPointerToPath(jsonPointer);
    return PathUtils.getFieldNameFromPath(path);
  } catch {
    return '';
  }
}

export function isRenameMove(fromPath: string, toPath: string): boolean {
  return (
    PathUtils.getParentJsonPointer(fromPath) ===
    PathUtils.getParentJsonPointer(toPath)
  );
}

export function movesIntoArrayBoundary(
  fromPath: string,
  toPath: string,
): boolean {
  return (
    PathUtils.countArrayDepthFromJsonPointer(toPath) >
    PathUtils.countArrayDepthFromJsonPointer(fromPath)
  );
}

export function computeMetadataChanges(
  baseSchema: JsonSchemaType | null,
  currentSchema: JsonSchemaType | null,
) {
  return metadataExtractor.computeMetadataChanges(baseSchema, currentSchema);
}

export function hasTypeChanged(
  baseSchema: JsonSchemaType | null,
  currentSchema: JsonSchemaType | null,
): boolean {
  return metadataExtractor.hasTypeChanged(baseSchema, currentSchema);
}
