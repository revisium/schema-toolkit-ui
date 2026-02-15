import type { FC } from 'react';
import type { NodeRendererType, NodeVM } from '../../vm/types';
import { ContainerRendererComponent } from './ContainerRenderer';
import { StringRendererComponent } from './StringRenderer';
import { NumberRendererComponent } from './NumberRenderer';
import { BooleanRendererComponent } from './BooleanRenderer';
import { ForeignKeyRendererComponent } from './ForeignKeyRenderer';
import { FileRendererComponent } from './FileRenderer';
import { MarkdownRendererComponent } from './MarkdownRenderer';

export const NODE_RENDERERS: Record<NodeRendererType, FC<{ node: NodeVM }>> = {
  container: ContainerRendererComponent as FC<{ node: NodeVM }>,
  string: StringRendererComponent as FC<{ node: NodeVM }>,
  number: NumberRendererComponent as FC<{ node: NodeVM }>,
  boolean: BooleanRendererComponent as FC<{ node: NodeVM }>,
  foreignKey: ForeignKeyRendererComponent as FC<{ node: NodeVM }>,
  file: FileRendererComponent as FC<{ node: NodeVM }>,
  markdown: MarkdownRendererComponent as FC<{ node: NodeVM }>,
};
