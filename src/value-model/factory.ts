import type { SchemaDefinition } from './core/types';
import { createNodeFactory, NodeFactory } from './node/NodeFactory';
import type { ValueNode } from './node/types';
import { ValueTree } from './tree/ValueTree';
import { FormulaEngine } from './formula/FormulaEngine';
import type { FormulaEngineOptions } from './formula/types';

export interface CreateValueModelOptions {
  nodeFactory?: NodeFactory;
  formulaEngine?: boolean | FormulaEngineOptions;
}

export function createValueModel(
  schema: SchemaDefinition,
  initialValue: unknown,
  options?: CreateValueModelOptions,
): ValueTree {
  const nodeFactory = options?.nodeFactory ?? createNodeFactory();
  const rootNode = nodeFactory.createTree(schema, initialValue);

  propagateFactoryToArrays(rootNode, nodeFactory);

  const tree = new ValueTree(rootNode);

  if (options?.formulaEngine !== false) {
    const formulaOptions =
      typeof options?.formulaEngine === 'object' ? options.formulaEngine : {};
    const engine = new FormulaEngine(tree, formulaOptions);
    tree.setFormulaEngine(engine);
  }

  return tree;
}

function propagateFactoryToArrays(node: ValueNode, factory: NodeFactory): void {
  if (node.isArray()) {
    node.setNodeFactory(factory);
    for (const item of node.value) {
      propagateFactoryToArrays(item, factory);
    }
  } else if (node.isObject()) {
    for (const child of node.children) {
      propagateFactoryToArrays(child, factory);
    }
  }
}

export function createEmptyValueModel(
  schema: SchemaDefinition,
  options?: CreateValueModelOptions,
): ValueTree {
  return createValueModel(schema, undefined, options);
}
