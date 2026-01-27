import type { JsonSchemaType } from '../schema/JsonSchema';
import { SchemaMetadataExtractor } from './SchemaMetadataExtractor';
import { PatchPathUtils } from './PatchPathUtils';

export type {
  RichPatch,
  MetadataChangeType,
  DefaultValueType,
  MetadataChangesResult,
} from './RichPatchTypes';

const metadataExtractor = new SchemaMetadataExtractor();
const pathUtils = new PatchPathUtils();

export function getSchemaType(schema: JsonSchemaType | null): string {
  return metadataExtractor.getSchemaType(schema);
}

export function getFieldNameFromPath(path: string): string {
  return pathUtils.getFieldNameFromPath(path);
}

export function isRenameMove(fromPath: string, toPath: string): boolean {
  return pathUtils.isRenameMove(fromPath, toPath);
}

export function movesIntoArrayBoundary(
  fromPath: string,
  toPath: string,
): boolean {
  return pathUtils.movesIntoArrayBoundary(fromPath, toPath);
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
