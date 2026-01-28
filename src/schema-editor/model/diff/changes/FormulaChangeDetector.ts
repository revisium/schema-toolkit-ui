import type { SchemaTree } from '../../tree/SchemaTree';
import { FormulaSerializer } from '../../formula';
import { SchemaSerializer } from '../../schema/SchemaSerializer';
import type { JsonPatch } from '../SchemaPatch';

export class FormulaChangeDetector {
  private readonly serializer = new SchemaSerializer();

  constructor(
    private readonly currentTree: SchemaTree,
    private readonly baseTree: SchemaTree,
  ) {}

  public detectIndirectFormulaChanges(
    existingPatches: JsonPatch[],
  ): JsonPatch[] {
    const patchedPaths = new Set(existingPatches.map((p) => p.path));
    const result: JsonPatch[] = [];

    this.baseTree.forEachFormula((formulaNodeId) => {
      const currentNode = this.currentTree.nodeById(formulaNodeId);
      if (currentNode.isNull()) {
        return;
      }

      const currentPath = this.currentTree
        .pathOf(formulaNodeId)
        .asJsonPointer();
      if (patchedPaths.has(currentPath)) {
        return;
      }

      const baseFormula = this.baseTree.getFormulaByNodeId(formulaNodeId);
      const currentFormula = currentNode.formula();

      if (!baseFormula || !currentFormula) {
        return;
      }

      const baseExpression = new FormulaSerializer(
        this.baseTree,
        formulaNodeId,
        baseFormula,
      ).serialize();

      const currentExpression = new FormulaSerializer(
        this.currentTree,
        formulaNodeId,
        currentFormula,
      ).serialize();

      if (baseExpression !== currentExpression) {
        const schema = this.serializer.serializeWithTree(
          currentNode,
          this.currentTree,
        );
        result.push({
          op: 'replace',
          path: currentPath,
          value: schema,
        });
      }
    });

    return result;
  }
}
