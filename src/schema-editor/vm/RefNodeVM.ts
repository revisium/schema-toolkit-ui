import { makeObservable, observable, computed, action } from 'mobx';
import { type SchemaNode, SchemaParser } from '../model';
import { isResolvableRef, getResolvedSchema } from '../config/system-schemas';
import { BaseNodeVM } from './BaseNodeVM';
import { createNodeVM, registerVMClass, type NodeVM } from './createNodeVM';
import type { SchemaEditorVM } from './SchemaEditorVM';
import type { ObjectNodeVM } from './ObjectNodeVM';

export class RefNodeVM extends BaseNodeVM {
  public isCollapsedState: boolean = true;
  public childrenList: NodeVM[] = [];
  private readonly _isResolvable: boolean;

  constructor(
    node: SchemaNode,
    editor: SchemaEditorVM,
    private readonly _parent: ObjectNodeVM | null,
    isRoot: boolean = false,
    isReadonly: boolean = false,
  ) {
    super(node, editor, isRoot, isReadonly);

    this._isResolvable = isResolvableRef(node.ref());

    makeObservable(this, {
      isCollapsedState: observable,
      childrenList: observable.shallow,
      isCollapsed: computed,
      children: computed,
      toggleCollapsed: action.bound,
      removeSelf: action.bound,
      changeType: action.bound,
    });

    if (this._isResolvable) {
      this.initResolvedChildren();
    }
  }

  private initResolvedChildren(): void {
    const resolvedSchema = getResolvedSchema(this._node.ref());
    if (!resolvedSchema) {
      return;
    }

    const parser = new SchemaParser();
    const resolvedRoot = parser.parse(resolvedSchema);

    this.childrenList = resolvedRoot
      .properties()
      .map((child) => createNodeVM(child, this._editor, null, false, true));
  }

  public get ref(): string {
    return this._node.ref();
  }

  public override get isCollapsible(): boolean {
    return this._isResolvable;
  }

  public get isCollapsed(): boolean {
    return this.isCollapsedState;
  }

  public toggleCollapsed(): void {
    this.isCollapsedState = !this.isCollapsedState;
  }

  public get children(): readonly NodeVM[] {
    return this.childrenList;
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

registerVMClass('RefNodeVM', RefNodeVM);
