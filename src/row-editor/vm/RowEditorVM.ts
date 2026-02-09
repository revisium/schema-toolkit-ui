import { makeAutoObservable, reaction } from 'mobx';
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
import type { NodeVM, EditorContext, RowEditorCallbacks } from './types';

export type RowEditorMode = 'creating' | 'editing' | 'reading';

export interface RowEditorVMOptions {
  mode?: RowEditorMode;
  rowId?: string;
  onChange?: (patches: readonly JsonValuePatch[]) => void;
  onSave?: (
    rowId: string,
    value: unknown,
    patches: readonly JsonValuePatch[],
  ) => void;
  onCancel?: () => void;
  callbacks?: RowEditorCallbacks;
  refSchemas?: Record<string, JsonSchema>;
  collapseComplexity?: number;
}

export class RowEditorVM implements EditorContext {
  private readonly _rowModel: RowModel;
  private readonly _core: RowEditorCore;
  private readonly _mode: RowEditorMode;
  private readonly _callbacks: RowEditorCallbacks | null;
  private readonly _onChange:
    | ((patches: readonly JsonValuePatch[]) => void)
    | null;
  private readonly _onSave:
    | ((
        rowId: string,
        value: unknown,
        patches: readonly JsonValuePatch[],
      ) => void)
    | null;
  private readonly _onCancel: (() => void) | null;
  private readonly _disposeReaction: (() => void) | null;
  private _prevPatchCount = 0;
  private _rowId: string;
  private readonly _initialRowId: string;

  constructor(
    schema: JsonSchema,
    initialValue?: unknown,
    options?: RowEditorVMOptions,
  ) {
    ensureReactivityProvider();
    this._mode = options?.mode ?? 'editing';
    this._rowId = options?.rowId ?? '';
    this._initialRowId = this._rowId;
    this._callbacks = options?.callbacks ?? null;
    this._onChange = options?.onChange ?? null;
    this._onSave = options?.onSave ?? null;
    this._onCancel = options?.onCancel ?? null;
    this._rowModel = createRowModel({
      rowId: 'editor',
      schema,
      data: initialValue,
      refSchemas: options?.refSchemas,
    });
    this._core = new RowEditorCore(this._rowModel.tree, this, {
      collapseComplexity: options?.collapseComplexity,
    });

    makeAutoObservable(this, {}, { autoBind: true });

    this._disposeReaction = this._onChange
      ? reaction(
          () => this.patches,
          () => this._emitChange(),
        )
      : null;
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

  get rowId(): string {
    return this._rowId;
  }

  get initialRowId(): string {
    return this._initialRowId;
  }

  get isRowIdChanged(): boolean {
    return this._rowId !== this._initialRowId;
  }

  setRowId(value: string): void {
    this._rowId = value;
  }

  get isDirty(): boolean {
    return this._rowModel.isDirty;
  }

  get hasChanges(): boolean {
    return this.isDirty || this.isRowIdChanged;
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

  get callbacks(): RowEditorCallbacks | null {
    return this._callbacks;
  }

  get patches(): readonly JsonValuePatch[] {
    return this._rowModel.patches;
  }

  getValue(): unknown {
    return this._rowModel.getPlainValue();
  }

  save(): void {
    const value = this.getValue();
    const patches = this.patches;
    this.commit();
    this._onSave?.(this._rowId, value, patches);
  }

  markAsSaved(): void {
    this.commit();
  }

  cancel(): void {
    this._onCancel?.();
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
    this._disposeReaction?.();
    this._core.dispose();
    this._rowModel.dispose();
  }

  private _emitChange(): void {
    if (!this._onChange || !this.isValid) {
      return;
    }
    const all = this.patches;
    const newPatches = all.slice(this._prevPatchCount);
    this._prevPatchCount = all.length;
    if (newPatches.length > 0) {
      this._onChange(newPatches);
    }
  }
}
