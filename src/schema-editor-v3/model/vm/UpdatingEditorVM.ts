import { makeAutoObservable } from 'mobx';
import type { JsonObjectSchema } from '@revisium/schema-toolkit';
import {
  SchemaEditorCore,
  type SchemaEditorCoreOptions,
  type ViewMode,
} from '../core';
import { SchemaTreeVM } from './SchemaTreeVM';
import { ReviewChangesDialogVM } from '../dialog/ReviewChangesDialogVM';
import { ReviewErrorsDialogVM } from '../dialog/ReviewErrorsDialogVM';

export type UpdateDialogViewMode = 'Changes' | 'Patches';

export interface UpdatingEditorVMOptions extends SchemaEditorCoreOptions {
  onApprove?: () => Promise<boolean>;
}

export class UpdatingEditorVM {
  private readonly _core: SchemaEditorCore;
  private readonly _onApprove: (() => Promise<boolean>) | null;

  public readonly tree: SchemaTreeVM;

  private _isErrorsDialogOpen = false;
  private _isChangesDialogOpen = false;
  private _updateDialogViewMode: UpdateDialogViewMode = 'Changes';

  constructor(
    coreOrSchema: SchemaEditorCore | JsonObjectSchema,
    options: UpdatingEditorVMOptions = {},
  ) {
    if (coreOrSchema instanceof SchemaEditorCore) {
      this._core = coreOrSchema;
    } else {
      this._core = new SchemaEditorCore(coreOrSchema, options);
    }
    this._onApprove = options.onApprove ?? null;
    this.tree = new SchemaTreeVM(this._core);

    makeAutoObservable(this, { tree: false }, { autoBind: true });
  }

  // ============ Mode ============

  public get mode(): 'updating' {
    return 'updating';
  }

  // ============ Toolbar ============

  public get loading(): boolean {
    return this._core.view.loading;
  }

  public get viewMode(): ViewMode {
    return this._core.view.viewMode;
  }

  public setViewMode(mode: ViewMode): void {
    this._core.view.setViewMode(mode);
  }

  public cancel(): void {
    this._core.cancel();
  }

  public collapseAll(): void {
    this._core.collapse.collapseAll();
  }

  public expandAll(): void {
    this._core.collapse.expandAll();
  }

  // ============ Errors Dialog ============

  public get showReviewErrorsButton(): boolean {
    return this._core.validation.hasErrors;
  }

  public get errorsCount(): number {
    return this._core.validation.errorsCount;
  }

  public get isErrorsDialogOpen(): boolean {
    return this._isErrorsDialogOpen;
  }

  public openErrorsDialog(): void {
    this._isErrorsDialogOpen = true;
  }

  public closeErrorsDialog(): void {
    this._isErrorsDialogOpen = false;
  }

  public get errorsDialogVM(): ReviewErrorsDialogVM {
    return new ReviewErrorsDialogVM(
      this._core.tableModel,
      () => this._core.tableIdError,
      () => this._core.validation.collectFormulaInputErrors(),
    );
  }

  // ============ Changes Dialog ============

  public get showApplyChangesButton(): boolean {
    return (
      !this._core.validation.hasErrors &&
      (this._core.isDirty || this._core.isTableIdChanged)
    );
  }

  public get totalChangesCount(): number {
    return this._core.totalChangesCount;
  }

  public get isChangesDialogOpen(): boolean {
    return this._isChangesDialogOpen;
  }

  public openChangesDialog(): void {
    this._isChangesDialogOpen = true;
  }

  public closeChangesDialog(): void {
    this._isChangesDialogOpen = false;
  }

  public get updateDialogViewMode(): UpdateDialogViewMode {
    return this._updateDialogViewMode;
  }

  public setUpdateDialogViewMode(mode: UpdateDialogViewMode): void {
    this._updateDialogViewMode = mode;
  }

  public get changesDialogVM(): ReviewChangesDialogVM {
    return new ReviewChangesDialogVM(
      this._core.tableModel,
      () => this.approve(),
      () => this.revert(),
      () => this.closeChangesDialog(),
    );
  }

  // ============ Actions ============

  public revert(): void {
    this._core.revert();
  }

  public async approve(): Promise<void> {
    if (!this._onApprove) {
      return;
    }
    this._core.view.setLoading(true);
    try {
      const success = await this._onApprove();
      if (success) {
        this._core.markAsSaved();
        this.closeChangesDialog();
      }
    } finally {
      this._core.view.setLoading(false);
    }
  }

  // ============ View Data ============

  public getPlainSchema(): JsonObjectSchema {
    return this._core.getPlainSchema();
  }

  public getPatches() {
    return this._core.getPatches();
  }

  public getJsonPatches() {
    return this._core.getJsonPatches();
  }

  public dispose(): void {
    this._core.dispose();
  }
}
