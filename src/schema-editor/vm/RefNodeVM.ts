import { makeObservable, action } from 'mobx';
import { type SchemaNode } from '../model';
import { BaseNodeVM } from './BaseNodeVM';
import { registerVMClass } from './createNodeVM';
import type { SchemaEditorVM } from './SchemaEditorVM';
import type { ObjectNodeVM } from './ObjectNodeVM';

export class RefNodeVM extends BaseNodeVM {
  constructor(
    node: SchemaNode,
    editor: SchemaEditorVM,
    private readonly _parent: ObjectNodeVM | null,
    isRoot: boolean = false,
  ) {
    super(node, editor, isRoot);

    makeObservable(this, {
      removeSelf: action.bound,
      changeType: action.bound,
    });
  }

  public get ref(): string {
    return this._node.ref();
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
