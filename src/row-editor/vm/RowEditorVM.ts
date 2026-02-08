import { makeAutoObservable } from 'mobx';
import type {
  JsonSchema,
  JsonValuePatch,
  Diagnostic,
  RowModel,
} from '@revisium/schema-toolkit';
import { createRowModel } from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../lib/initReactivity';
import type { FlatItem } from './flattenNodes';
import { RowEditorCore } from './RowEditorCore';
import type { NodeVM, EditorContext } from './types';

export type RowEditorMode = 'creating' | 'editing' | 'reading';

export interface RowEditorVMOptions {
  mode?: RowEditorMode;
}

export class RowEditorVM implements EditorContext {
  private readonly _rowModel: RowModel;
  private readonly _core: RowEditorCore;
  private readonly _mode: RowEditorMode;
  private _prevPatchCount = 0;

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
    this._core = new RowEditorCore(this._rowModel.tree, this);

    makeAutoObservable(this, {}, { autoBind: true });
  }

  get root(): NodeVM {
    return this._core.root;
  }

  get flattenedNodes(): readonly FlatItem[] {
    return this._core.flattenedNodes;
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

  get patches(): readonly JsonValuePatch[] {
    return this._rowModel.patches;
  }

  get lastPatches(): readonly JsonValuePatch[] {
    const all = this._rowModel.patches;
    return all.slice(this._prevPatchCount);
  }

  consumePatches(): readonly JsonValuePatch[] {
    const result = this.lastPatches;
    this._prevPatchCount = this._rowModel.patches.length;
    return result;
  }

  getValue(): unknown {
    return this._rowModel.getPlainValue();
  }

  commit(): void {
    this._rowModel.commit();
    this._prevPatchCount = 0;
  }

  revert(): void {
    this._rowModel.revert();
    this._prevPatchCount = 0;
  }

  dispose(): void {
    this._core.dispose();
    this._rowModel.dispose();
  }
}
