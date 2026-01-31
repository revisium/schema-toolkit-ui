import { makeObservable, computed, action, override } from 'mobx';
import { type SchemaNode } from '../model';
import { BaseNodeVM } from './BaseNodeVM';
import { registerVMClass } from './createNodeVM';
import type { SchemaEditorVM } from './SchemaEditorVM';
import type { ObjectNodeVM } from './ObjectNodeVM';

export class ForeignKeyNodeVM extends BaseNodeVM {
  constructor(
    node: SchemaNode,
    editor: SchemaEditorVM,
    private readonly _parent: ObjectNodeVM | null,
    isRoot: boolean = false,
    isReadonly: boolean = false,
  ) {
    super(node, editor, isRoot, isReadonly);

    makeObservable(this, {
      label: override,
      foreignKeyValue: computed,
      setForeignKey: action.bound,
      selectForeignKey: action.bound,
      removeSelf: action.bound,
      changeType: action.bound,
    });
  }

  public override get label(): string {
    return 'foreign key';
  }

  public get foreignKeyValue(): string {
    return this._node.foreignKey() ?? '';
  }

  public setForeignKey(tableId: string | null): void {
    this._editor.engine.updateForeignKey(this.nodeId, tableId ?? '');
  }

  public selectForeignKey(): void {
    this._editor.triggerForeignKeySelection(this);
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

registerVMClass('ForeignKeyNodeVM', ForeignKeyNodeVM);
