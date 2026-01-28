import { parseFormula, type ASTNode } from '@revisium/formula';
import type { Formula } from '../core/Formula';
import type { FormulaDependency } from '../core/FormulaDependency';
import { ResolvedDependency } from '../core/FormulaDependency';
import { FormulaError } from '../core/FormulaError';
import type { NodeTree } from '../../tree/NodeTree';
import type { Path } from '../../path/Path';
import { RelativePath } from './RelativePath';

export class ParsedFormula implements Formula {
  private readonly astNode: ASTNode;
  private readonly deps: readonly FormulaDependency[];
  private readonly astPathToNodeId: ReadonlyMap<string, string>;

  constructor(tree: NodeTree, formulaNodeId: string, expression: string) {
    const parseResult = parseFormula(expression);
    this.astNode = parseResult.ast;

    const formulaPath = tree.pathOf(formulaNodeId);
    if (formulaPath.isEmpty() && tree.root().id() !== formulaNodeId) {
      throw new FormulaError('Formula node not found in tree', formulaNodeId);
    }

    const deps: FormulaDependency[] = [];
    const astPathToNodeId = new Map<string, string>();

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
      deps.push(new ResolvedDependency(targetNodeId));
      astPathToNodeId.set(depPath, targetNodeId);
    }

    this.deps = deps;
    this.astPathToNodeId = astPathToNodeId;
  }

  version(): number {
    return 1;
  }

  ast(): ASTNode {
    return this.astNode;
  }

  dependencies(): readonly FormulaDependency[] {
    return this.deps;
  }

  getNodeIdForAstPath(astPath: string): string | null {
    return this.astPathToNodeId.get(astPath) ?? null;
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
      basePath = basePath.parent();
      if (!lastSegment?.isItems()) {
        break;
      }
    }

    return basePath;
  }
}
