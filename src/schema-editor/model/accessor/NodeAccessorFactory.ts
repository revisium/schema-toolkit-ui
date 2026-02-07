import type { SchemaNode, SchemaModel } from '@revisium/schema-toolkit';
import type { TreeState } from '../state/TreeState';
import { NodeState } from './NodeState';
import { NodeLabel } from './NodeLabel';
import { NodeFormula } from './NodeFormula';
import { NodeValidation } from './NodeValidation';
import { NodeActions, type NodeActionsCallbacks } from './NodeActions';
import { NodeAccessor } from './NodeAccessor';

export interface NodeAccessorDependencies {
  state: NodeState;
  label: NodeLabel;
  formula: NodeFormula;
  validation: NodeValidation;
  actions: NodeActions;
}

export interface NodeAccessorContext {
  schemaModel: SchemaModel;
  treeState: TreeState;
  getTableId: () => string;
  getTableIdError: () => string | null;
  callbacks: NodeActionsCallbacks;
}

export class NodeAccessorFactory {
  public create(
    node: SchemaNode,
    context: NodeAccessorContext,
    isRoot: boolean = false,
    isReadonly: boolean = false,
  ): NodeAccessor {
    const state = new NodeState(node.id(), context.treeState);
    const label = new NodeLabel(node, context.getTableId, isRoot);
    const formula = new NodeFormula(node, context.schemaModel);
    const validation = new NodeValidation(
      node,
      context.schemaModel,
      formula,
      context.getTableIdError,
      isRoot,
    );
    const actions = new NodeActions(
      node,
      context.schemaModel,
      context.callbacks,
      isRoot,
      isReadonly,
    );

    return new NodeAccessor(
      node,
      { state, label, formula, validation, actions },
      isRoot,
      isReadonly,
    );
  }
}
