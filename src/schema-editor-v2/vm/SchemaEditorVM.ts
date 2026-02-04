import { makeAutoObservable } from 'mobx';
import {
  createTableModel,
  type TableModel,
  type SchemaModel,
  type FieldType,
  type JsonObjectSchema,
  type SchemaPatch,
  type JsonPatch,
  type SchemaValidationError,
  type TreeFormulaValidationError,
  type SchemaNode,
  isValidFieldName,
  FIELD_NAME_ERROR_MESSAGE,
  generateDefaultValue,
} from '@revisium/schema-toolkit';
import { ViewerSwitcherMode } from '../types';
import { SchemaTypeIds } from '../config';
import { createNodeVM, type NodeVM } from './createNodeVM';
import { PrimitiveNodeVM } from './node/PrimitiveNodeVM';

// Import all VM classes to ensure they are registered
import './node/ObjectNodeVM';
import './node/ArrayNodeVM';
import './node/ForeignKeyNodeVM';
import './node/RefNodeVM';

const DEFAULT_COLLAPSE_COMPLEXITY = 14;

export type SchemaEditorMode = 'creating' | 'updating';

export type ForeignKeySelectionCallback = () => Promise<string | null>;

export interface SchemaEditorOptions {
  tableId?: string;
  mode?: SchemaEditorMode;
  collapseComplexSchemas?: boolean;
  collapseComplexity?: number;
  onApprove?: () => Promise<boolean>;
  onCancel?: () => void;
  onSelectForeignKey?: ForeignKeySelectionCallback;
}

export class SchemaEditorVM {
  private readonly _tableModel: TableModel;
  private _rootNodeVM: NodeVM;

  private readonly _shouldCollapseAll: boolean;
  private readonly _mode: SchemaEditorMode;
  private readonly _onApprove: (() => Promise<boolean>) | null;
  private readonly _onCancel: (() => void) | null;
  private readonly _onSelectForeignKey: ForeignKeySelectionCallback | null;

  private _loading = false;
  private _viewMode: ViewerSwitcherMode = ViewerSwitcherMode.Tree;
  private _isChangesDialogOpen = false;
  private _createDialogViewMode: 'Example' | 'Schema' = 'Example';
  private _updateDialogViewMode: 'Changes' | 'Patches' = 'Changes';

  constructor(jsonSchema: JsonObjectSchema, options: SchemaEditorOptions = {}) {
    this._tableModel = createTableModel({
      tableId: options.tableId ?? '',
      schema: jsonSchema,
    });

    this._mode = options.mode ?? 'creating';
    this._onApprove = options.onApprove ?? null;
    this._onCancel = options.onCancel ?? null;
    this._onSelectForeignKey = options.onSelectForeignKey ?? null;

    const shouldCollapse = options.collapseComplexSchemas ?? false;
    const complexity =
      options.collapseComplexity ?? DEFAULT_COLLAPSE_COMPLEXITY;
    const nodeCount = this._tableModel.schema.nodeCount;
    this._shouldCollapseAll = shouldCollapse && nodeCount >= complexity;

    this._rootNodeVM = createNodeVM(
      this._tableModel.schema.root,
      this,
      null,
      true,
    );

    makeAutoObservable(this, {}, { autoBind: true });
  }

  public get mode(): SchemaEditorMode {
    return this._mode;
  }

  public get schemaModel(): SchemaModel {
    return this._tableModel.schema;
  }

  public get shouldCollapseAll(): boolean {
    return this._shouldCollapseAll;
  }

  public get tableId(): string {
    return this._tableModel.tableId;
  }

  public get initialTableId(): string {
    return this._tableModel.baseTableId;
  }

  public get isTableIdChanged(): boolean {
    return this._tableModel.isRenamed;
  }

  public get tableIdError(): string | null {
    if (!isValidFieldName(this._tableModel.tableId)) {
      return FIELD_NAME_ERROR_MESSAGE;
    }
    return null;
  }

  public setTableId(value: string): void {
    this._tableModel.rename(value);
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

  public get updateDialogViewMode(): 'Changes' | 'Patches' {
    return this._updateDialogViewMode;
  }

  public setUpdateDialogViewMode(mode: 'Changes' | 'Patches'): void {
    this._updateDialogViewMode = mode;
  }

  public get rootNodeVM(): NodeVM {
    return this._rootNodeVM;
  }

  public get isDirty(): boolean {
    return this._tableModel.isDirty;
  }

  public get isValid(): boolean {
    return this._tableModel.schema.isValid && this.tableIdError === null;
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

  public get validationErrors(): readonly SchemaValidationError[] {
    return this._tableModel.schema.validationErrors;
  }

  public get formulaErrors(): TreeFormulaValidationError[] {
    const schemaErrors = this._tableModel.schema.formulaErrors;
    const inputErrors = this.collectFormulaInputErrors(this._rootNodeVM);
    return [...schemaErrors, ...inputErrors];
  }

  private collectFormulaInputErrors(
    nodeVM: NodeVM,
  ): TreeFormulaValidationError[] {
    const errors: TreeFormulaValidationError[] = [];

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
    this._tableModel.commit();
  }

  public revert(): void {
    this._tableModel.revert();
    this._rootNodeVM = createNodeVM(
      this._tableModel.schema.root,
      this,
      null,
      true,
    );
  }

  public changeRootType(typeId: string): void {
    const currentRoot = this._tableModel.schema.root;
    if (currentRoot.isNull()) {
      return;
    }

    if (typeId === SchemaTypeIds.Array && !currentRoot.isArray()) {
      const result = this._tableModel.schema.wrapRootInArray();
      if (result) {
        const arrayNode = this._tableModel.schema.nodeById(result.newNodeId);
        this._rootNodeVM = createNodeVM(arrayNode, this, null, true);
      }
      return;
    }

    const fieldType = this.typeIdToFieldType(typeId);
    if (fieldType) {
      const result = this._tableModel.schema.replaceRoot(fieldType);
      if (result) {
        this._rootNodeVM = createNodeVM(
          this._tableModel.schema.root,
          this,
          null,
          true,
        );
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
      const success = await this._onApprove();
      if (success) {
        this.markAsSaved();
        this.closeChangesDialog();
      }
    } finally {
      this._loading = false;
    }
  }

  public cancel(): void {
    this._onCancel?.();
  }

  public getPatches(): SchemaPatch[] {
    return this._tableModel.schema.patches;
  }

  public getJsonPatches(): JsonPatch[] {
    return this._tableModel.schema.jsonPatches;
  }

  public getPlainSchema(): JsonObjectSchema {
    return this._tableModel.schema.plainSchema;
  }

  public getExampleData(): unknown {
    return generateDefaultValue(this.getPlainSchema());
  }

  public typeIdToFieldType(typeId: string): FieldType | null {
    const mapping: Record<string, FieldType> = {
      [SchemaTypeIds.String]: 'string',
      [SchemaTypeIds.Number]: 'number',
      [SchemaTypeIds.Boolean]: 'boolean',
      [SchemaTypeIds.Object]: 'object',
      [SchemaTypeIds.Array]: 'array',
    };
    return mapping[typeId] ?? null;
  }

  public createRefNodeByTypeId(
    _typeId: string,
    _name: string,
  ): SchemaNode | null {
    return null;
  }

  public replaceNodeWithRef(_nodeId: string, _refNode: SchemaNode): void {
    // This operation is not directly supported by SchemaModel
    // Would need custom implementation if needed
  }

  public moveNode(fromNodeId: string, toParentId: string): void {
    this._tableModel.schema.moveNode(fromNodeId, toParentId);
  }

  public dispose(): void {
    // Nothing to clean up now
  }
}
