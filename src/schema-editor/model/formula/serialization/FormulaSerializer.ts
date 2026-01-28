import { serializeAst, replaceDependencies } from '@revisium/formula';
import type { Formula } from '../core/Formula';
import type { NodeTree } from '../../tree/NodeTree';
import { FormulaError } from '../core/FormulaError';
import type { XFormula } from '../../schema/JsonSchema';
import { RelativePathBuilder } from './RelativePathBuilder';

export class FormulaSerializer {
  private readonly relativePathBuilder = new RelativePathBuilder();

  constructor(
    private readonly tree: NodeTree,
    private readonly formulaNodeId: string,
    private readonly formula: Formula,
  ) {}

  static toXFormula(
    tree: NodeTree,
    formulaNodeId: string,
    formula: Formula,
  ): XFormula {
    const serializer = new FormulaSerializer(tree, formulaNodeId, formula);
    return {
      version: 1,
      expression: serializer.serialize(),
    };
  }

  serialize(): string {
    const replacements = this.buildPathReplacements();
    const updatedAst = replaceDependencies(this.formula.ast(), replacements);
    return serializeAst(updatedAst);
  }

  private buildPathReplacements(): Record<string, string> {
    const replacements: Record<string, string> = {};
    const formulaPath = this.tree.pathOf(this.formulaNodeId);

    for (const astPath of this.formula.astPaths()) {
      const nodeId = this.formula.getNodeIdForAstPath(astPath);
      if (!nodeId) {
        continue;
      }

      const targetNode = this.tree.nodeById(nodeId);
      if (targetNode.isNull()) {
        throw new FormulaError(
          `Cannot serialize formula: target node not found`,
          this.formulaNodeId,
          `Target nodeId: ${nodeId}`,
        );
      }

      const targetPath = this.tree.pathOf(nodeId);
      const newPath = this.relativePathBuilder.buildWithArrayNotation(
        formulaPath,
        targetPath,
      );

      if (this.needsReplacement(astPath, newPath)) {
        replacements[astPath] = newPath;
      }
    }

    return replacements;
  }

  private needsReplacement(astPath: string, newPath: string): boolean {
    if (astPath === newPath) {
      return false;
    }

    const normalizedAstPath = this.normalizeArrayNotation(astPath);
    const normalizedNewPath = this.normalizeArrayNotation(newPath);

    return normalizedAstPath !== normalizedNewPath;
  }

  private normalizeArrayNotation(path: string): string {
    return path.replace(/\[\d+\]/g, '[*]');
  }
}
