import type {
  NodeVM,
  PrimitiveNodeVM,
  ObjectNodeVM,
  ArrayNodeVM,
  ForeignKeyNodeVM,
  FileNodeVM,
} from '../../vm/types';

export interface NodeRendererContext {
  node: NodeVM;
}

export interface PrimitiveRendererContext {
  node: PrimitiveNodeVM;
}

export interface ContainerRendererContext {
  node: ObjectNodeVM | ArrayNodeVM;
}

export interface ForeignKeyRendererContext {
  node: ForeignKeyNodeVM;
}

export interface FileRendererContext {
  node: FileNodeVM;
}
