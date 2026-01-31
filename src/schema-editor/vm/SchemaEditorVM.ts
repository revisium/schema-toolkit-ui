import { makeAutoObservable } from 'mobx';
import { ViewerSwitcherMode } from '../types';
import {
  SchemaEngine,
  getDefaultValueFromSchema,
  type JsonObjectSchema,
  type SchemaPatch,
  type JsonPatch,
  type ValidationError,
  type FormulaValidationError,
  type SchemaNode,
} from '../model';
import {
  isValidFieldName,
  FIELD_NAME_ERROR_MESSAGE,
} from '../model/validation/FieldNameValidator';
import { createNodeByTypeId, SchemaTypeIds } from '../config';
import { createNodeVM, type NodeVM } from './createNodeVM';
import { PrimitiveNodeVM } from './PrimitiveNodeVM';

// Import all VM classes to ensure they are registered
import './ArrayNodeVM';
import './ForeignKeyNodeVM';
import './RefNodeVM';

const DEFAULT_COLLAPSE_COMPLEXITY = 14;

export type SchemaEditorMode = 'creating' | 'updating';

export type ForeignKeySelectionCallback = () => Promise<string | null>;

export interface SchemaEditorOptions {
  tableId?: string;
  mode?: SchemaEditorMode;
  collapseComplexSchemas?: boolean;
  collapseComplexity?: number;
  onApprove?: () => Promise<void>;
  onCancel?: () => void;
  onSelectForeignKey?: ForeignKeySelectionCallback;
}

export class SchemaEditorVM {
  private readonly _engine: SchemaEngine;
  private _rootNodeVM: NodeVM;

  private _tableId: string;
  private _initialTableId: string;
  private readonly _shouldCollapseAll: boolean;
  private readonly _mode: SchemaEditorMode;
  private readonly _onApprove: (() => Promise<void>) | null;
  private readonly _onCancel: (() => void) | null;
  private readonly _onSelectForeignKey: ForeignKeySelectionCallback | null;

  private _loading = false;
  private _viewMode: ViewerSwitcherMode = ViewerSwitcherMode.Tree;
  private _isChangesDialogOpen = false;
  private _createDialogViewMode: 'Example' | 'Schema' = 'Example';

  constructor(jsonSchema: JsonObjectSchema, options: SchemaEditorOptions = {}) {
    this._engine = new SchemaEngine(jsonSchema);

    this._tableId = options.tableId ?? '';
    this._initialTableId = this._tableId;
    this._mode = options.mode ?? 'creating';
    this._onApprove = options.onApprove ?? null;
    this._onCancel = options.onCancel ?? null;
    this._onSelectForeignKey = options.onSelectForeignKey ?? null;

    const shouldCollapse = options.collapseComplexSchemas ?? false;
    const complexity =
      options.collapseComplexity ?? DEFAULT_COLLAPSE_COMPLEXITY;
    const nodeCount = this._engine.countNodes();
    this._shouldCollapseAll = shouldCollapse && nodeCount >= complexity;

    this._rootNodeVM = createNodeVM(this._engine.root(), this, null, true);

    makeAutoObservable(this, {}, { autoBind: true });
  }

  public get mode(): SchemaEditorMode {
    return this._mode;
  }

  public get engine(): SchemaEngine {
    return this._engine;
  }

  public get shouldCollapseAll(): boolean {
    return this._shouldCollapseAll;
  }

  public get tableId(): string {
    return this._tableId;
  }

  public get initialTableId(): string {
    return this._initialTableId;
  }

  public get isTableIdChanged(): boolean {
    return this._tableId !== this._initialTableId;
  }

  public get tableIdError(): string | null {
    if (!isValidFieldName(this._tableId)) {
      return FIELD_NAME_ERROR_MESSAGE;
    }
    return null;
  }

  public setTableId(value: string): void {
    this._tableId = value;
  }

  public get loading(): boolean {
    return this._loading;
  }

  public setLoading(value: boolean): void {
    this._loading = value;
  }

  public get viewMode(): ViewerSwitcherMode {
    return this._viewMode;
  }

  public setViewMode(mode: ViewerSwitcherMode): void {
    this._viewMode = mode;
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

  public get createDialogViewMode(): 'Example' | 'Schema' {
    return this._createDialogViewMode;
  }

  public setCreateDialogViewMode(mode: 'Example' | 'Schema'): void {
    this._createDialogViewMode = mode;
  }

  public get rootNodeVM(): NodeVM {
    return this._rootNodeVM;
  }

  public get isDirty(): boolean {
    return this._engine.isDirty || this.isTableIdChanged;
  }

  public get isValid(): boolean {
    return this._engine.isValid;
  }

  public get isApproveDisabled(): boolean {
    return !this.isValid || !this.isDirty;
  }

  public get patchesCount(): number {
    return this.getPatches().length;
  }

  public get totalChangesCount(): number {
    return this.patchesCount + (this.isTableIdChanged ? 1 : 0);
  }

  public get validationErrors(): readonly ValidationError[] {
    return this._engine.validationErrors;
  }

  public get formulaErrors(): FormulaValidationError[] {
    const engineErrors = this._engine.validateFormulas();
    const inputErrors = this.collectFormulaInputErrors(this._rootNodeVM);
    return [...engineErrors, ...inputErrors];
  }

  private collectFormulaInputErrors(nodeVM: NodeVM): FormulaValidationError[] {
    const errors: FormulaValidationError[] = [];

    if (nodeVM instanceof PrimitiveNodeVM && nodeVM.formulaErrorValue) {
      errors.push({
        nodeId: nodeVM.nodeId,
        fieldPath: nodeVM.name || undefined,
        message: nodeVM.formulaErrorValue,
      });
    }

    if ('children' in nodeVM && Array.isArray(nodeVM.children)) {
      for (const child of nodeVM.children as NodeVM[]) {
        errors.push(...this.collectFormulaInputErrors(child));
      }
    }

    if ('itemsVM' in nodeVM && nodeVM.itemsVM) {
      errors.push(...this.collectFormulaInputErrors(nodeVM.itemsVM));
    }

    return errors;
  }

  public get hasErrors(): boolean {
    return (
      this.validationErrors.length > 0 ||
      this.formulaErrors.length > 0 ||
      this.tableIdError !== null
    );
  }

  public markAsSaved(): void {
    this._engine.markAsSaved();
    this._initialTableId = this._tableId;
  }

  public revert(): void {
    this._engine.revert();
    this._tableId = this._initialTableId;
    this._rootNodeVM = createNodeVM(this._engine.root(), this, null, true);
  }

  public changeRootType(typeId: string): void {
    const currentRoot = this._engine.root();
    if (currentRoot.isNull()) {
      return;
    }

    if (typeId === SchemaTypeIds.Array && !currentRoot.isArray()) {
      const result = this._engine.wrapRootInArray();
      if (result) {
        const arrayNode = this._engine.nodeById(result.newNodeId);
        this._rootNodeVM = createNodeVM(arrayNode, this, null, true);
      }
      return;
    }

    const newNode = this.createNodeByTypeId(typeId, currentRoot.name());
    if (newNode) {
      const result = this._engine.replaceRootWith(newNode);
      if (result) {
        this._rootNodeVM = createNodeVM(newNode, this, null, true);
      }
    }
  }

  public async selectForeignKey(): Promise<string | null> {
    if (!this._onSelectForeignKey) {
      return null;
    }
    return this._onSelectForeignKey();
  }

  public async approve(): Promise<void> {
    if (!this._onApprove) {
      return;
    }
    this._loading = true;
    try {
      await this._onApprove();
      this.markAsSaved();
      this.closeChangesDialog();
    } finally {
      this._loading = false;
    }
  }

  public cancel(): void {
    this._onCancel?.();
  }

  public getPatches(): SchemaPatch[] {
    return this._engine.getPatches();
  }

  public getJsonPatches(): JsonPatch[] {
    return this._engine.getPatches().map((p) => p.patch);
  }

  public getPlainSchema(): JsonObjectSchema {
    return this._engine.getPlainSchema() as unknown as JsonObjectSchema;
  }

  public getExampleData(): unknown {
    return getDefaultValueFromSchema(this.getPlainSchema());
  }

  public createNodeByTypeId(typeId: string, name: string): SchemaNode | null {
    return createNodeByTypeId(typeId, name);
  }

  public dispose(): void {
    // Nothing to clean up now
  }
}
