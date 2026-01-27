import { makeObservable, observable, computed, action } from 'mobx';
import { type SchemaNode } from '../model';
import { SchemaTypeIds } from '../config';
import { BaseNodeVM } from './BaseNodeVM';
import { createNodeVM, registerVMClass, type NodeVM } from './createNodeVM';
import type { SchemaEditorVM } from './SchemaEditorVM';

export class ObjectNodeVM extends BaseNodeVM {
  public isCollapsedState: boolean;
  public propertyList: NodeVM[] = [];

  constructor(
    node: SchemaNode,
    editor: SchemaEditorVM,
    private readonly _parent: ObjectNodeVM | null,
    isRoot: boolean = false,
  ) {
    super(node, editor, isRoot);

    this.isCollapsedState = editor.shouldCollapseAll && !isRoot;

    makeObservable(this, {
      isCollapsedState: observable,
      propertyList: observable.shallow,
      isCollapsed: computed,
      children: computed,
      showAddButton: computed,
      toggleCollapsed: action.bound,
      addProperty: action.bound,
      removeProperty: action.bound,
      replaceProperty: action.bound,
      moveNodeHere: action.bound,
      removeSelf: action.bound,
      changeType: action.bound,
    });

    this.initChildren();
  }

  private initChildren(): void {
    this.propertyList = this._node
      .properties()
      .map((child) => createNodeVM(child, this._editor, this));
  }

  public override get isCollapsible(): boolean {
    return !this._isRoot;
  }

  public get isCollapsed(): boolean {
    return this.isCollapsedState;
  }

  public toggleCollapsed(): void {
    this.isCollapsedState = !this.isCollapsedState;
  }

  public get children(): readonly NodeVM[] {
    return this.propertyList;
  }

  public get showAddButton(): boolean {
    return this._node.isObject();
  }

  public override get isValidDropTarget(): boolean {
    return true;
  }

  public addProperty(name: string): void {
    const newNode = this._editor.engine.addChild(this.nodeId, name);
    if (!newNode.isNull()) {
      const childVM = createNodeVM(newNode, this._editor, this);
      this.propertyList.push(childVM);
    }
  }

  public removeProperty(childVM: NodeVM): void {
    const removed = this._editor.engine.removeNode(childVM.nodeId);
    if (removed) {
      const index = this.propertyList.indexOf(childVM);
      if (index >= 0) {
        this.propertyList.splice(index, 1);
      }
    }
  }

  public replaceProperty(childVM: NodeVM, typeId: string): void {
    const currentNode = childVM.node;
    if (currentNode.isNull()) {
      return;
    }

    if (typeId === SchemaTypeIds.Array && !currentNode.isArray()) {
      const result = this._editor.engine.wrapInArray(childVM.nodeId);
      if (result) {
        const arrayNode = this._editor.engine.nodeById(result.newNodeId);
        const newVM = createNodeVM(arrayNode, this._editor, this);
        this.replacePropertyVM(childVM, newVM);
      }
      return;
    }

    const newNode = this._editor.createNodeByTypeId(typeId, currentNode.name());
    if (newNode) {
      const result = this._editor.engine.replaceNode(childVM.nodeId, newNode);
      if (result) {
        const newVM = createNodeVM(newNode, this._editor, this);
        this.replacePropertyVM(childVM, newVM);
      }
    }
  }

  private replacePropertyVM(oldVM: NodeVM, newVM: NodeVM): void {
    const index = this.propertyList.indexOf(oldVM);
    if (index >= 0) {
      this.propertyList[index] = newVM;
    }
  }

  public moveNodeHere(fromNodeId: string): void {
    const fromNode = this._editor.engine.nodeById(fromNodeId);
    if (fromNode.isNull()) {
      return;
    }

    this._editor.engine.moveNode(fromNodeId, this.nodeId);

    const movedNode = this._editor.engine.nodeById(fromNodeId);
    if (!movedNode.isNull()) {
      this._editor.rootNodeVM.removePropertyVMByNodeId(fromNodeId);
      const movedVM = createNodeVM(movedNode, this._editor, this);
      this.propertyList.push(movedVM);
    }
  }

  public removeSelf(): void {
    if (this._parent) {
      this._parent.removeProperty(this);
    }
  }

  public changeType(typeId: string): void {
    if (this._parent) {
      this._parent.replaceProperty(this, typeId);
    }
  }

  public removePropertyVMByNodeId(nodeId: string): boolean {
    const index = this.propertyList.findIndex((vm) => vm.nodeId === nodeId);
    if (index >= 0) {
      this.propertyList.splice(index, 1);
      return true;
    }
    for (const child of this.propertyList) {
      if (child instanceof ObjectNodeVM) {
        const found = child.removePropertyVMByNodeId(nodeId);
        if (found) {
          return true;
        }
      }
    }
    return false;
  }
}

registerVMClass('ObjectNodeVM', ObjectNodeVM);
