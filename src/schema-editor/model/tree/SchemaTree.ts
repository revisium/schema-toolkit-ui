import { makeAutoObservable } from 'mobx';
import type { NodeTree } from './NodeTree';
import type { SchemaNode } from '../node/SchemaNode';
import type { Path } from '../path/Path';
import { NULL_NODE } from '../node/NullNode';
import {
  FormulaDependencyIndex,
  type FormulaDependent,
} from '../formula/FormulaDependencyIndex';
import type { Formula } from '../formula/Formula';
import { FormulaUpdater } from '../formula/FormulaUpdater';
import { TreeNodeIndex } from './TreeNodeIndex';
import { TreeMutator } from './TreeMutator';

export class SchemaTree implements NodeTree {
  private readonly nodeIndex: TreeNodeIndex;
  private readonly mutator: TreeMutator;
  private readonly formulaIndex: FormulaDependencyIndex;
  private _rootNode: SchemaNode;

  constructor(rootNode: SchemaNode) {
    this._rootNode = rootNode;
    this.nodeIndex = new TreeNodeIndex();
    this.mutator = new TreeMutator();
    this.formulaIndex = new FormulaDependencyIndex();
    this.rebuildIndex();

    makeAutoObservable(this, {}, { autoBind: true });
  }

  public root(): SchemaNode {
    return this._rootNode;
  }

  public countNodes(): number {
    return this.nodeIndex.countNodes();
  }

  public nodeById(id: string): SchemaNode {
    return this.nodeIndex.getNode(id);
  }

  public pathOf(id: string): Path {
    return this.nodeIndex.getPath(id);
  }

  public nodeAt(path: Path): SchemaNode {
    if (path.isEmpty()) {
      return this._rootNode;
    }

    let current: SchemaNode = this._rootNode;
    for (const segment of path.segments()) {
      if (segment.isProperty()) {
        current = current.child(segment.propertyName());
      } else {
        current = current.items();
      }
      if (current.isNull()) {
        return NULL_NODE;
      }
    }
    return current;
  }

  public replaceRoot(newRoot: SchemaNode): void {
    this._rootNode = newRoot;
    this.rebuildIndex();
  }

  public setNodeAt(path: Path, node: SchemaNode): void {
    this.mutator.setNodeAt(this._rootNode, path, node);
    this.rebuildIndex();
  }

  public removeNodeAt(path: Path): void {
    this.mutator.removeNodeAt(this._rootNode, path);
    this.rebuildIndex();
  }

  public renameNode(id: string, newName: string): void {
    const node = this.nodeById(id);
    if (node.isNull()) {
      return;
    }

    const oldName = node.name();
    node.setName(newName);

    this.rebuildIndex();
    new FormulaUpdater(this).updateFormulasOnRename(id, oldName, newName);
  }

  public addChildTo(parentId: string, node: SchemaNode): void {
    const parent = this.nodeById(parentId);
    if (parent.isNull() || !parent.isObject()) {
      return;
    }
    parent.addChild(node);
    this.rebuildIndex();
  }

  public canMoveNode(fromNodeId: string, toNodeId: string): boolean {
    if (fromNodeId === toNodeId) {
      return false;
    }
    const fromNode = this.nodeById(fromNodeId);
    const toNode = this.nodeById(toNodeId);
    if (fromNode.isNull() || toNode.isNull()) {
      return false;
    }
    if (!toNode.isObject()) {
      return false;
    }
    const toPath = this.pathOf(toNodeId);
    const fromPath = this.pathOf(fromNodeId);
    const fromPointer = fromPath.asJsonPointer();
    const toPointer = toPath.asJsonPointer();
    if (toPointer === fromPointer || toPointer.startsWith(fromPointer + '/')) {
      return false;
    }
    if (this.isCurrentParent(fromPath, toPath)) {
      return false;
    }
    return true;
  }

  public hasValidDropTarget(nodeId: string): boolean {
    return this.findValidDropTarget(this._rootNode, nodeId);
  }

  private findValidDropTarget(current: SchemaNode, nodeId: string): boolean {
    if (current.isObject() && this.canMoveNode(nodeId, current.id())) {
      return true;
    }

    if (current.isObject()) {
      for (const child of current.children()) {
        if (this.findValidDropTarget(child, nodeId)) {
          return true;
        }
      }
    }

    if (current.isArray()) {
      const items = current.items();
      if (!items.isNull() && this.findValidDropTarget(items, nodeId)) {
        return true;
      }
    }

    return false;
  }

  private isCurrentParent(fromPath: Path, toPath: Path): boolean {
    const fromParent = fromPath.parent();
    return fromParent.asJsonPointer() === toPath.asJsonPointer();
  }

  public moveNode(nodeId: string, targetParentId: string): void {
    const node = this.nodeById(nodeId);
    const targetParent = this.nodeById(targetParentId);
    if (node.isNull() || targetParent.isNull() || !targetParent.isObject()) {
      return;
    }

    const sourcePath = this.pathOf(nodeId);
    if (sourcePath.isEmpty()) {
      return;
    }

    const oldPath = sourcePath;

    this.mutator.removeNodeAtInternal(this._rootNode, sourcePath.segments(), 0);
    targetParent.addChild(node);
    this.rebuildIndex();

    const newPath = this.pathOf(nodeId);
    new FormulaUpdater(this).updateFormulasOnMove(nodeId, oldPath, newPath);
  }

  public registerFormula(formulaNodeId: string, formula: Formula): void {
    const node = this.nodeById(formulaNodeId);
    if (node.isNull()) {
      return;
    }
    this.formulaIndex.registerFormula(formulaNodeId, node.name(), formula);
  }

  public unregisterFormula(formulaNodeId: string): void {
    this.formulaIndex.unregisterFormula(formulaNodeId);
  }

  public getFormulaDependents(nodeId: string): FormulaDependent[] {
    const result: FormulaDependent[] = [];
    this.collectFormulaDependents(nodeId, result, new Set());
    return result;
  }

  public getDirectFormulaDependents(nodeId: string): FormulaDependent[] {
    const result: FormulaDependent[] = [];
    this.collectDirectDependents(nodeId, result, new Set());
    return result;
  }

  public hasFormulaDependents(nodeId: string): boolean {
    return this.getFormulaDependents(nodeId).length > 0;
  }

  public getFormulaByNodeId(nodeId: string): Formula | null {
    return this.formulaIndex.getFormula(nodeId);
  }

  public clearFormulaIndex(): void {
    this.formulaIndex.clear();
  }

  private rebuildIndex(): void {
    this.nodeIndex.rebuild(this._rootNode);
  }

  private collectFormulaDependents(
    nodeId: string,
    result: FormulaDependent[],
    seen: Set<string>,
  ): void {
    this.collectDirectDependents(nodeId, result, seen);
    this.collectChildDependents(nodeId, result, seen);
  }

  private collectDirectDependents(
    nodeId: string,
    result: FormulaDependent[],
    seen: Set<string>,
  ): void {
    const directDependentIds = this.formulaIndex.getDependents(nodeId);

    for (const formulaNodeId of directDependentIds) {
      if (seen.has(formulaNodeId)) {
        continue;
      }
      seen.add(formulaNodeId);

      const dependent = this.createFormulaDependent(formulaNodeId);
      if (dependent) {
        result.push(dependent);
      }
    }
  }

  private createFormulaDependent(
    formulaNodeId: string,
  ): FormulaDependent | null {
    const formulaNode = this.nodeById(formulaNodeId);
    const formula = this.formulaIndex.getFormula(formulaNodeId);

    if (formulaNode.isNull() || !formula) {
      return null;
    }

    return {
      formulaNodeId,
      fieldName: formulaNode.name(),
      expression: formula.expression(),
    };
  }

  private collectChildDependents(
    nodeId: string,
    result: FormulaDependent[],
    seen: Set<string>,
  ): void {
    const node = this.nodeById(nodeId);
    if (node.isNull()) {
      return;
    }

    if (node.isObject()) {
      for (const child of node.children()) {
        this.collectFormulaDependents(child.id(), result, seen);
      }
    }

    if (node.isArray()) {
      const items = node.items();
      if (!items.isNull()) {
        this.collectFormulaDependents(items.id(), result, seen);
      }
    }
  }
}
