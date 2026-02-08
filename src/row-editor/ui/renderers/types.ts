import type {
  NodeVM,
  PrimitiveNodeVM,
  ObjectNodeVM,
  ArrayNodeVM,
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
