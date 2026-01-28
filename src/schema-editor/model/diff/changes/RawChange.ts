import type { SchemaNode } from '../../node/SchemaNode';

export type ChangeType = 'added' | 'removed' | 'moved' | 'modified';

export interface RawChange {
  type: ChangeType;
  baseNode: SchemaNode | null;
  currentNode: SchemaNode | null;
}
