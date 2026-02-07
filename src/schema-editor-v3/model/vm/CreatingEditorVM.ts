import { makeAutoObservable } from 'mobx';
import type { JsonObjectSchema } from '@revisium/schema-toolkit';
import {
  SchemaEditorCore,
  type SchemaEditorCoreOptions,
  type ViewMode,
} from '../core';
import { SchemaTreeVM } from './SchemaTreeVM';
import { CreateTableDialogVM } from '../dialog/CreateTableDialogVM';
import { ReviewErrorsDialogVM } from '../dialog/ReviewErrorsDialogVM';

export type CreateDialogViewMode = 'Example' | 'Schema';

export interface CreatingEditorVMOptions extends SchemaEditorCoreOptions {
  onApprove?: () => Promise<boolean>;
}

export class CreatingEditorVM {
  private readonly _core: SchemaEditorCore;
  private readonly _onApprove: (() => Promise<boolean>) | null;

  public readonly tree: SchemaTreeVM;

  private _isErrorsDialogOpen = false;
  private _isCreateDialogOpen = false;
  private _createDialogViewMode: CreateDialogViewMode = 'Example';

  constructor(
    coreOrSchema: SchemaEditorCore | JsonObjectSchema,
    options: CreatingEditorVMOptions = {},
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

  public get mode(): 'creating' {
    return 'creating';
  }

  // ============ Table ID ============

  public get tableId(): string {
    return this._core.tableId;
  }

  public get initialTableId(): string {
    return this._core.initialTableId;
  }

  public get isTableIdChanged(): boolean {
    return this._core.isTableIdChanged;
  }

  public get tableIdError(): string | null {
    return this._core.tableIdError;
  }

  public setTableId(value: string): void {
    this._core.setTableId(value);
  }

  // ============ State ============

  public get isDirty(): boolean {
    return this._core.isDirty;
  }

  public get isValid(): boolean {
    return this._core.isValid;
  }

  public markAsSaved(): void {
    this._core.markAsSaved();
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

  // ============ Create Dialog ============

  public get showCreateTableButton(): boolean {
    return this._core.isValid && !this._core.validation.hasErrors;
  }

  public get isCreateDialogOpen(): boolean {
    return this._isCreateDialogOpen;
  }

  public openCreateDialog(): void {
    this._isCreateDialogOpen = true;
  }

  public closeCreateDialog(): void {
    this._isCreateDialogOpen = false;
  }

  public get createDialogViewMode(): CreateDialogViewMode {
    return this._createDialogViewMode;
  }

  public setCreateDialogViewMode(mode: CreateDialogViewMode): void {
    this._createDialogViewMode = mode;
  }

  public get createDialogVM(): CreateTableDialogVM {
    return new CreateTableDialogVM(
      this._core.tableModel,
      () => this.approve(),
      () => this.closeCreateDialog(),
    );
  }

  // ============ Actions ============

  public async approve(): Promise<void> {
    if (!this._onApprove) {
      return;
    }
    this._core.view.setLoading(true);
    try {
      const success = await this._onApprove();
      if (success) {
        this._core.markAsSaved();
        this.closeCreateDialog();
      }
    } finally {
      this._core.view.setLoading(false);
    }
  }

  // ============ View Data ============

  public getPlainSchema(): JsonObjectSchema {
    return this._core.getPlainSchema();
  }

  public dispose(): void {
    this._core.dispose();
  }
}
