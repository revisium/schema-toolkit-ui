import type { SchemaNode } from '../../node/SchemaNode';
import type { NodeTree } from '../../tree/NodeTree';
import { FormulaSerializer } from '../../formula/serialization/FormulaSerializer';
import type {
  DefaultValueType,
  MetadataChangeType,
  MetadataChangesResult,
} from '../SchemaPatch';

export class NodeMetadataExtractor {
  public getNodeType(node: SchemaNode | null): string {
    if (!node || node.isNull()) {
      return 'unknown';
    }

    if (node.isRef()) {
      return node.ref();
    }

    if (node.isArray()) {
      const items = node.items();
      if (!items.isNull()) {
        const itemsType = this.getNodeType(items);
        return `array<${itemsType}>`;
      }
      return 'array';
    }

    return node.nodeType();
  }

  public getFormulaExpression(
    tree: NodeTree,
    node: SchemaNode | null,
  ): string | undefined {
    if (!node || node.isNull()) {
      return undefined;
    }
    const formula = node.formula();
    if (!formula) {
      return undefined;
    }
    return new FormulaSerializer(tree, node.id(), formula).serialize();
  }

  public getDefaultValue(node: SchemaNode | null): DefaultValueType {
    if (!node || node.isNull()) {
      return undefined;
    }
    const def = node.defaultValue();
    if (
      typeof def === 'string' ||
      typeof def === 'number' ||
      typeof def === 'boolean'
    ) {
      return def;
    }
    return undefined;
  }

  public getDescription(node: SchemaNode | null): string | undefined {
    if (!node || node.isNull()) {
      return undefined;
    }
    return node.metadata().description;
  }

  public getDeprecated(node: SchemaNode | null): boolean | undefined {
    if (!node || node.isNull()) {
      return undefined;
    }
    return node.metadata().deprecated;
  }

  public getForeignKey(node: SchemaNode | null): string | undefined {
    if (!node || node.isNull()) {
      return undefined;
    }
    return node.foreignKey();
  }

  public computeMetadataChanges(
    baseTree: NodeTree,
    baseNode: SchemaNode | null,
    currentTree: NodeTree,
    currentNode: SchemaNode | null,
  ): MetadataChangesResult {
    const changes: MetadataChangeType[] = [];
    let formulaChange: MetadataChangesResult['formulaChange'];
    let defaultChange: MetadataChangesResult['defaultChange'];
    let descriptionChange: MetadataChangesResult['descriptionChange'];
    let deprecatedChange: MetadataChangesResult['deprecatedChange'];

    const effectiveCurrentNode = this.getEffectiveNodeForComparison(
      baseNode,
      currentNode,
    );

    const baseDesc = this.getDescription(baseNode);
    const currentDesc = this.getDescription(effectiveCurrentNode);
    if (baseDesc !== currentDesc) {
      changes.push('description');
      descriptionChange = {
        fromDescription: baseDesc,
        toDescription: currentDesc,
      };
    }

    const baseDeprecated = this.getDeprecated(baseNode);
    const currentDeprecated = this.getDeprecated(effectiveCurrentNode);
    if (baseDeprecated !== currentDeprecated) {
      changes.push('deprecated');
      deprecatedChange = {
        fromDeprecated: baseDeprecated,
        toDeprecated: currentDeprecated,
      };
    }

    const baseFormula = this.getFormulaExpression(baseTree, baseNode);
    const currentFormula = this.getFormulaExpression(
      currentTree,
      effectiveCurrentNode,
    );
    if (baseFormula !== currentFormula) {
      changes.push('formula');
      formulaChange = { fromFormula: baseFormula, toFormula: currentFormula };
    }

    const baseForeignKey = this.getForeignKey(baseNode);
    const currentForeignKey = this.getForeignKey(effectiveCurrentNode);
    if (baseForeignKey !== currentForeignKey) {
      changes.push('foreignKey');
    }

    const baseDefault = this.getDefaultValue(baseNode);
    const currentDefault = this.getDefaultValue(effectiveCurrentNode);
    if (baseDefault !== currentDefault) {
      changes.push('default');
      defaultChange = { fromDefault: baseDefault, toDefault: currentDefault };
    }

    return {
      metadataChanges: changes,
      formulaChange,
      defaultChange,
      descriptionChange,
      deprecatedChange,
    };
  }

  private getEffectiveNodeForComparison(
    baseNode: SchemaNode | null,
    currentNode: SchemaNode | null,
  ): SchemaNode | null {
    if (
      baseNode &&
      !baseNode.isNull() &&
      baseNode.isPrimitive() &&
      currentNode &&
      !currentNode.isNull() &&
      currentNode.isArray()
    ) {
      const items = currentNode.items();
      return items.isNull() ? null : items;
    }
    return currentNode;
  }

  public hasTypeChanged(
    baseNode: SchemaNode | null,
    currentNode: SchemaNode | null,
  ): boolean {
    const baseType = this.getNodeType(baseNode);
    const currentType = this.getNodeType(currentNode);
    return baseType !== currentType;
  }
}
