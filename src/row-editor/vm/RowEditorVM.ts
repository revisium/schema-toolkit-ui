import { makeObservable, computed, action } from 'mobx';
import type {
  JsonSchema,
  Diagnostic,
  RowModel,
} from '@revisium/schema-toolkit';
import { createRowModel } from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../lib/initReactivity';
import { createNodeVM } from './createNodeVM';
import type { NodeVM, EditorContext } from './types';

export type RowEditorMode = 'creating' | 'editing' | 'reading';

export interface RowEditorVMOptions {
  mode?: RowEditorMode;
}

export class RowEditorVM implements EditorContext {
  private readonly _rowModel: RowModel;
  private readonly _root: NodeVM;
  private readonly _mode: RowEditorMode;

  constructor(
    schema: JsonSchema,
    initialValue?: unknown,
    options?: RowEditorVMOptions,
  ) {
    ensureReactivityProvider();
    this._mode = options?.mode ?? 'editing';
    this._rowModel = createRowModel({
      rowId: 'editor',
      schema,
      data: initialValue,
    });
    this._root = createNodeVM(this._rowModel.tree.root, null, this);

    makeObservable(this, {
      isDirty: computed,
      isValid: computed,
      errors: computed,
      isReadOnly: computed,
      commit: action,
      revert: action,
    });
  }

  get root(): NodeVM {
    return this._root;
  }

  get rowModel(): RowModel {
    return this._rowModel;
  }

  get mode(): RowEditorMode {
    return this._mode;
  }

  get isDirty(): boolean {
    return this._rowModel.isDirty;
  }

  get isValid(): boolean {
    return this._rowModel.isValid;
  }

  get errors(): readonly Diagnostic[] {
    return this._rowModel.errors;
  }

  get isReadOnly(): boolean {
    return this._mode === 'reading';
  }

  getValue(): unknown {
    return this._rowModel.getPlainValue();
  }

  commit(): void {
    this._rowModel.commit();
  }

  revert(): void {
    this._rowModel.revert();
  }

  dispose(): void {
    this._rowModel.dispose();
  }
}
