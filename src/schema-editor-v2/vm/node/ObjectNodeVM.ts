import { makeObservable, observable, computed, action } from 'mobx';
import type { SchemaNode } from '@revisium/schema-toolkit';
import { BaseNodeVM } from './BaseNodeVM';
import { createNodeVM, registerVMClass, type NodeVM } from '../createNodeVM';
import type { SchemaEditorVM } from '../SchemaEditorVM';
import { SchemaTypeIds } from '../../config';

export class ObjectNodeVM extends BaseNodeVM {
  public isCollapsedState: boolean;
  public propertyList: NodeVM[] = [];

  constructor(
    node: SchemaNode,
    editor: SchemaEditorVM,
    private readonly _parent: ObjectNodeVM | null,
    isRoot: boolean = false,
    isReadonly: boolean = false,
  ) {
    super(node, editor, isRoot, isReadonly);

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
    const newNode = this._editor.schemaModel.addField(
      this.nodeId,
      name,
      'string',
    );
    if (!newNode.isNull()) {
      const childVM = createNodeVM(newNode, this._editor, this);
      this.propertyList.push(childVM);
    }
  }

  public removeProperty(childVM: NodeVM): void {
    const removed = this._editor.schemaModel.removeField(childVM.nodeId);
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

    if (typeId === 'Array' && !currentNode.isArray()) {
      const result = this._editor.schemaModel.wrapInArray(childVM.nodeId);
      if (result) {
        const arrayNode = this._editor.schemaModel.nodeById(result.newNodeId);
        const newVM = createNodeVM(arrayNode, this._editor, this);
        this.replacePropertyVM(childVM, newVM);
      }
      return;
    }

    if (typeId === SchemaTypeIds.ForeignKeyString) {
      let nodeId = childVM.nodeId;
      if (currentNode.nodeType() !== 'string') {
        const newNode = this._editor.schemaModel.changeFieldType(
          nodeId,
          'string',
        );
        nodeId = newNode.id();
      }
      this._editor.schemaModel.updateForeignKey(nodeId, '');
      const updatedNode = this._editor.schemaModel.nodeById(nodeId);
      const newVM = createNodeVM(updatedNode, this._editor, this);
      this.replacePropertyVM(childVM, newVM);
      return;
    }

    const fieldType = this._editor.typeIdToFieldType(typeId);
    if (fieldType) {
      const newNode = this._editor.schemaModel.changeFieldType(
        childVM.nodeId,
        fieldType,
      );
      this._editor.schemaModel.updateForeignKey(newNode.id(), undefined);
      const newVM = createNodeVM(newNode, this._editor, this);
      this.replacePropertyVM(childVM, newVM);
    } else {
      const refNode = this._editor.createRefNodeByTypeId(
        typeId,
        currentNode.name(),
      );
      if (refNode) {
        this._editor.replaceNodeWithRef(childVM.nodeId, refNode);
        const updatedNode = this._editor.schemaModel.nodeById(refNode.id());
        const newVM = createNodeVM(updatedNode, this._editor, this);
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
    const fromNode = this._editor.schemaModel.nodeById(fromNodeId);
    if (fromNode.isNull()) {
      return;
    }

    this._editor.moveNode(fromNodeId, this.nodeId);

    const movedNode = this._editor.schemaModel.nodeById(fromNodeId);
    if (!movedNode.isNull()) {
      const rootVM = this._editor.rootNodeVM;
      if (rootVM instanceof ObjectNodeVM) {
        rootVM.removePropertyVMByNodeId(fromNodeId);
      }
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
    if (this._isRoot) {
      this._editor.changeRootType(typeId);
    } else if (this._parent) {
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
      if ('itemsVM' in child && child.itemsVM instanceof ObjectNodeVM) {
        const found = child.itemsVM.removePropertyVMByNodeId(nodeId);
        if (found) {
          return true;
        }
      }
    }
    return false;
  }
}

registerVMClass('ObjectNodeVM', ObjectNodeVM);
