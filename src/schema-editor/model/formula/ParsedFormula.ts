import { parseFormula, type ASTNode } from '@revisium/formula';
import type { Formula } from './Formula';
import type { FormulaDependency } from './FormulaDependency';
import { ResolvedDependency } from './FormulaDependency';
import type { NodeTree } from '../tree/NodeTree';
import type { Path } from '../path/Path';
import { FormulaError } from './FormulaError';
import { RelativePath } from './RelativePath';

export class ParsedFormula implements Formula {
  private readonly astNode: ASTNode;
  private readonly deps: readonly FormulaDependency[];
  private readonly expr: string;

  constructor(tree: NodeTree, formulaNodeId: string, expression: string) {
    this.expr = expression;

    const parseResult = parseFormula(expression);
    this.astNode = parseResult.ast;

    const formulaPath = tree.pathOf(formulaNodeId);
    if (formulaPath.isEmpty() && tree.root().id() !== formulaNodeId) {
      throw new FormulaError('Formula node not found in tree', formulaNodeId);
    }

    const deps: FormulaDependency[] = [];
    for (const depPath of parseResult.dependencies) {
      const targetNodeId = this.resolveDependencyPath(
        tree,
        formulaPath,
        depPath,
      );
      if (!targetNodeId) {
        throw new FormulaError(
          `Cannot resolve formula dependency: ${depPath}`,
          formulaNodeId,
          'Path not found in schema',
        );
      }
      if (targetNodeId === formulaNodeId) {
        throw new FormulaError(
          'Formula cannot reference itself',
          formulaNodeId,
          'Self-reference detected',
        );
      }
      deps.push(new ResolvedDependency(depPath, targetNodeId));
    }
    this.deps = deps;
  }

  version(): number {
    return 1;
  }

  expression(): string {
    return this.expr;
  }

  ast(): ASTNode {
    return this.astNode;
  }

  dependencies(): readonly FormulaDependency[] {
    return this.deps;
  }

  private resolveDependencyPath(
    tree: NodeTree,
    formulaPath: Path,
    depPath: string,
  ): string | null {
    const basePath = this.getFormulaBasePath(formulaPath);
    const relativePath = new RelativePath(basePath, depPath);
    const targetPath = relativePath.resolve();

    if (!targetPath) {
      return null;
    }

    const targetNode = tree.nodeAt(targetPath);
    if (targetNode.isNull()) {
      return null;
    }

    return targetNode.id();
  }

  private getFormulaBasePath(formulaPath: Path): Path {
    let basePath = formulaPath;

    while (!basePath.isEmpty()) {
      const lastSegment = basePath.lastSegment();
      if (lastSegment && lastSegment.isItems()) {
        basePath = basePath.parent();
      } else {
        basePath = basePath.parent();
        break;
      }
    }

    return basePath;
  }
}
