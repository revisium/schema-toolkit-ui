import type { SchemaTree } from '../tree/SchemaTree';
import type { Path } from '../path/Path';
import { ParsedFormula } from './ParsedFormula';
import type { SchemaNode } from '../node/SchemaNode';
import type { Formula } from './Formula';
import { FormulaPathConverter } from './FormulaPathConverter';
import { FormulaExpressionReplacer } from './FormulaExpressionReplacer';

export interface FormulaUpdate {
  formulaNodeId: string;
  oldExpression: string;
  newExpression: string;
}

export class FormulaUpdater {
  private readonly pathConverter: FormulaPathConverter;
  private readonly expressionReplacer: FormulaExpressionReplacer;

  constructor(private readonly tree: SchemaTree) {
    this.pathConverter = new FormulaPathConverter();
    this.expressionReplacer = new FormulaExpressionReplacer();
  }

  public updateFormulasOnRename(
    renamedNodeId: string,
    oldName: string,
    newName: string,
  ): FormulaUpdate[] {
    const updates: FormulaUpdate[] = [];
    const dependents = this.tree.getFormulaDependents(renamedNodeId);

    for (const dep of dependents) {
      const formulaNode = this.tree.nodeById(dep.formulaNodeId);
      if (formulaNode.isNull()) {
        continue;
      }

      const oldExpression = dep.expression;
      const newExpression = this.updateExpressionForRename(
        oldExpression,
        renamedNodeId,
        oldName,
        newName,
        dep.formulaNodeId,
      );

      if (newExpression !== oldExpression) {
        this.applyFormulaUpdate(formulaNode, dep.formulaNodeId, newExpression);
        updates.push({
          formulaNodeId: dep.formulaNodeId,
          oldExpression,
          newExpression,
        });
      }
    }

    return updates;
  }

  public updateFormulasOnMove(
    movedNodeId: string,
    _oldPath: Path,
    newPath: Path,
  ): FormulaUpdate[] {
    const updates: FormulaUpdate[] = [];

    const dependents = this.tree.getFormulaDependents(movedNodeId);
    for (const dep of dependents) {
      const formulaNode = this.tree.nodeById(dep.formulaNodeId);
      if (formulaNode.isNull()) {
        continue;
      }

      const oldExpression = dep.expression;
      const newExpression = this.updateExpressionForMove(
        oldExpression,
        movedNodeId,
        newPath,
        dep.formulaNodeId,
      );

      if (newExpression !== oldExpression) {
        this.applyFormulaUpdate(formulaNode, dep.formulaNodeId, newExpression);
        updates.push({
          formulaNodeId: dep.formulaNodeId,
          oldExpression,
          newExpression,
        });
      }
    }

    this.updateFormulasInsideMovedNode(movedNodeId, updates);

    return updates;
  }

  private updateFormulasInsideMovedNode(
    nodeId: string,
    updates: FormulaUpdate[],
  ): void {
    const formula = this.tree.getFormulaByNodeId(nodeId);
    if (formula) {
      const node = this.tree.nodeById(nodeId);
      if (!node.isNull()) {
        const oldExpression = formula.expression();
        const newExpression = this.updateFormulaAfterOwnerMove(formula, nodeId);
        if (newExpression !== oldExpression) {
          this.applyFormulaUpdate(node, nodeId, newExpression);
          updates.push({ formulaNodeId: nodeId, oldExpression, newExpression });
        }
      }
    }

    const node = this.tree.nodeById(nodeId);
    if (!node.isNull()) {
      if (node.isObject()) {
        for (const child of node.children()) {
          this.updateFormulasInsideMovedNode(child.id(), updates);
        }
      }
      if (node.isArray()) {
        const items = node.items();
        if (!items.isNull()) {
          this.updateFormulasInsideMovedNode(items.id(), updates);
        }
      }
    }
  }

  private updateFormulaAfterOwnerMove(
    formula: Formula,
    formulaNodeId: string,
  ): string {
    let result = formula.expression();
    const newFormulaPath = this.tree.pathOf(formulaNodeId);

    for (const dep of formula.dependencies()) {
      const originalPath = dep.originalPath();

      if (originalPath.startsWith('/')) {
        continue;
      }

      const targetPath = this.tree.pathOf(dep.targetNodeId());
      const newPath = this.determineNewPathAfterMove(
        originalPath,
        newFormulaPath,
        targetPath,
      );

      if (newPath !== originalPath) {
        result = this.expressionReplacer.replacePathInExpression(
          result,
          originalPath,
          newPath,
        );
      }
    }

    return result;
  }

  private determineNewPathAfterMove(
    originalPath: string,
    formulaPath: Path,
    targetPath: Path,
  ): string {
    const newRelPath = this.pathConverter.computeRelativePath(
      formulaPath,
      targetPath,
    );
    const isSimpleName = this.pathConverter.isSimpleName(originalPath);

    const shouldUseAbsolute =
      !newRelPath ||
      (isSimpleName && newRelPath.includes('/')) ||
      this.pathConverter.isComplexRelativePath(newRelPath);

    if (shouldUseAbsolute) {
      return this.pathConverter.pathToAbsolute(targetPath);
    }

    return newRelPath;
  }

  private updateExpressionForRename(
    expression: string,
    renamedNodeId: string,
    oldName: string,
    newName: string,
    formulaNodeId: string,
  ): string {
    const formula = this.tree.getFormulaByNodeId(formulaNodeId);
    if (!formula) {
      return expression;
    }

    let result = expression;

    for (const dep of formula.dependencies()) {
      if (this.isAncestorOrSelf(renamedNodeId, dep.targetNodeId())) {
        const originalPath = dep.originalPath();
        const newPath = this.expressionReplacer.replaceNameInPath(
          originalPath,
          oldName,
          newName,
        );
        result = this.expressionReplacer.replacePathInExpression(
          result,
          originalPath,
          newPath,
        );
      }
    }

    return result;
  }

  private updateExpressionForMove(
    expression: string,
    movedNodeId: string,
    newPath: Path,
    formulaNodeId: string,
  ): string {
    const formula = this.tree.getFormulaByNodeId(formulaNodeId);
    if (!formula) {
      return expression;
    }

    let result = expression;
    const formulaPath = this.tree.pathOf(formulaNodeId);

    for (const dep of formula.dependencies()) {
      if (this.isAncestorOrSelf(movedNodeId, dep.targetNodeId())) {
        const originalPath = dep.originalPath();

        if (originalPath.startsWith('/')) {
          const newAbsPath = this.pathConverter.pathToAbsolute(newPath);
          result = this.expressionReplacer.replacePathInExpression(
            result,
            originalPath,
            newAbsPath,
          );
        } else {
          const newRelPath = this.pathConverter.computeRelativePath(
            formulaPath,
            newPath,
          );
          if (newRelPath) {
            result = this.expressionReplacer.replacePathInExpression(
              result,
              originalPath,
              newRelPath,
            );
          } else {
            const newAbsPath = this.pathConverter.pathToAbsolute(newPath);
            result = this.expressionReplacer.replacePathInExpression(
              result,
              originalPath,
              newAbsPath,
            );
          }
        }
      }
    }

    return result;
  }

  private isAncestorOrSelf(ancestorId: string, nodeId: string): boolean {
    if (ancestorId === nodeId) {
      return true;
    }
    const ancestorPath = this.tree.pathOf(ancestorId).asJsonPointer();
    const nodePath = this.tree.pathOf(nodeId).asJsonPointer();
    return nodePath.startsWith(ancestorPath + '/');
  }

  private applyFormulaUpdate(
    node: SchemaNode,
    nodeId: string,
    newExpression: string,
  ): boolean {
    try {
      const newFormula = new ParsedFormula(this.tree, nodeId, newExpression);
      node.setFormula(newFormula);
      this.tree.registerFormula(nodeId, newFormula);
      return true;
    } catch {
      return false;
    }
  }
}
