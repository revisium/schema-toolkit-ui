import type { SchemaNode } from '../node/SchemaNode';
import type { Path } from '../path';

export interface NodeTree {
  root(): SchemaNode;

  nodeAt(path: Path): SchemaNode;
  nodeById(id: string): SchemaNode;
  pathOf(id: string): Path;

  setNodeAt(path: Path, node: SchemaNode): void;
  removeNodeAt(path: Path): void;
  renameNode(id: string, newName: string): void;
}
