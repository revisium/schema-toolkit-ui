import type { SchemaNode } from '../node/SchemaNode';
import type { SchemaTree } from '../tree/SchemaTree';

export interface FormulaValidationError {
  nodeId: string;
  message: string;
  fieldPath?: string;
}

export class FormulaValidator {
  constructor(private readonly tree: SchemaTree) {}

  validate(): FormulaValidationError[] {
    const errors: FormulaValidationError[] = [];
    this.collectErrors(this.tree.root(), '', errors);
    return errors;
  }

  validateNode(
    nodeId: string,
    fieldPath?: string,
  ): FormulaValidationError | null {
    const formula = this.tree.getFormulaByNodeId(nodeId);
    if (!formula) {
      return null;
    }

    for (const dep of formula.dependencies()) {
      const targetNode = this.tree.nodeById(dep.targetNodeId());
      if (targetNode.isNull()) {
        return {
          nodeId,
          message: `Cannot resolve formula dependency: ${dep.originalPath()}`,
          fieldPath: fieldPath || undefined,
        };
      }
    }

    return null;
  }

  private collectErrors(
    node: SchemaNode,
    currentPath: string,
    errors: FormulaValidationError[],
  ): void {
    if (node.isNull()) {
      return;
    }

    if (node.isPrimitive()) {
      const error = this.validateNode(node.id(), currentPath);
      if (error) {
        errors.push(error);
      }
    }

    if (node.isObject()) {
      for (const child of node.children()) {
        const childPath = currentPath
          ? `${currentPath}.${child.name()}`
          : child.name();
        this.collectErrors(child, childPath, errors);
      }
    }

    if (node.isArray()) {
      const items = node.items();
      if (!items.isNull()) {
        const itemsPath = `${currentPath}[*]`;
        this.collectErrors(items, itemsPath, errors);
      }
    }
  }
}
