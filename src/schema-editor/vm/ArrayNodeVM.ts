import { makeObservable, observable, computed, action } from 'mobx';
import { type SchemaNode } from '../model';
import { BaseNodeVM } from './BaseNodeVM';
import { createNodeVM, registerVMClass, type NodeVM } from './createNodeVM';
import type { SchemaEditorVM } from './SchemaEditorVM';
import type { ObjectNodeVM } from './ObjectNodeVM';

export class ArrayNodeVM extends BaseNodeVM {
  public isCollapsedState: boolean;
  public itemsVMRef: NodeVM | null = null;

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
      itemsVMRef: observable.ref,
      isCollapsed: computed,
      itemsVM: computed,
      toggleCollapsed: action.bound,
      changeItemsType: action.bound,
      removeSelf: action.bound,
      changeType: action.bound,
    });

    this.initItemsVM();
  }

  private initItemsVM(): void {
    const items = this._node.items();
    if (!items.isNull()) {
      this.itemsVMRef = createNodeVM(items, this._editor, null);
    }
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

  public get itemsVM(): NodeVM | null {
    return this.itemsVMRef;
  }

  public changeItemsType(typeId: string): void {
    if (!this.itemsVMRef) {
      return;
    }

    const currentItems = this._node.items();
    if (currentItems.isNull()) {
      return;
    }

    const newNode = this._editor.createNodeByTypeId(typeId, '');
    if (!newNode) {
      return;
    }

    const result = this._editor.engine.replaceNode(currentItems.id(), newNode);
    if (result) {
      this.itemsVMRef = createNodeVM(newNode, this._editor, null);
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
}

registerVMClass('ArrayNodeVM', ArrayNodeVM);
