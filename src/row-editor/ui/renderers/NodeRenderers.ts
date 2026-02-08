import type { FC } from 'react';
import type { NodeRendererType, NodeVM } from '../../vm/types';
import { ContainerRendererComponent } from './ContainerRenderer';
import { StringRendererComponent } from './StringRenderer';
import { NumberRendererComponent } from './NumberRenderer';
import { BooleanRendererComponent } from './BooleanRenderer';

export const NODE_RENDERERS: Record<NodeRendererType, FC<{ node: NodeVM }>> = {
  container: ContainerRendererComponent as FC<{ node: NodeVM }>,
  string: StringRendererComponent as FC<{ node: NodeVM }>,
  number: NumberRendererComponent as FC<{ node: NodeVM }>,
  boolean: BooleanRendererComponent as FC<{ node: NodeVM }>,
};
