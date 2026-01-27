import { makeAutoObservable } from 'mobx';
import { ViewerSwitcherMode, type JsonPatch } from '../types';
import type { JsonObjectSchema } from '../model';
import {
  SchemaEngine,
  getDefaultValueFromSchema,
  type RichPatch,
  type ValidationError,
  type FormulaValidationError,
  type SchemaNode,
} from '../model';
import { createNodeByTypeId } from '../config';
import { ObjectNodeVM } from './ObjectNodeVM';
import type { NodeVM } from './createNodeVM';
import { PrimitiveNodeVM } from './PrimitiveNodeVM';

// Import all VM classes to ensure they are registered
import './ArrayNodeVM';
import './PrimitiveNodeVM';
import './ForeignKeyNodeVM';
import './RefNodeVM';

const DEFAULT_COLLAPSE_COMPLEXITY = 14;

export type ForeignKeySelectionCallback = (nodeVM: NodeVM) => void;

export interface SchemaEditorOptions {
  tableId?: string;
  collapseComplexSchemas?: boolean;
  collapseComplexity?: number;
}

export class SchemaEditorVM {
  private readonly _engine: SchemaEngine;
  private _rootNodeVM: ObjectNodeVM;

  private _tableId: string;
  private readonly _shouldCollapseAll: boolean;
  private _onSelectForeignKey: ForeignKeySelectionCallback | null = null;

  private _loading = false;
  private _viewMode: ViewerSwitcherMode = ViewerSwitcherMode.Tree;
  private _isChangesDialogOpen = false;
  private _createDialogViewMode: 'Example' | 'Schema' = 'Example';

  constructor(jsonSchema: JsonObjectSchema, options: SchemaEditorOptions = {}) {
    this._engine = new SchemaEngine(jsonSchema);

    this._tableId = options.tableId ?? '';

    const shouldCollapse = options.collapseComplexSchemas ?? false;
    const complexity =
      options.collapseComplexity ?? DEFAULT_COLLAPSE_COMPLEXITY;
    const nodeCount = this._engine.countNodes();
    this._shouldCollapseAll = shouldCollapse && nodeCount >= complexity;

    this._rootNodeVM = new ObjectNodeVM(this._engine.root(), this, null, true);

    makeAutoObservable(this, {}, { autoBind: true });
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

  public get rootNodeVM(): ObjectNodeVM {
    return this._rootNodeVM;
  }

  public get isDirty(): boolean {
    return this._engine.isDirty;
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
    return this.validationErrors.length > 0 || this.formulaErrors.length > 0;
  }

  public markAsSaved(): void {
    this._engine.markAsSaved();
  }

  public revert(): void {
    this._engine.revert();
    this._rootNodeVM = new ObjectNodeVM(this._engine.root(), this, null, true);
  }

  public setOnSelectForeignKey(
    callback: ForeignKeySelectionCallback | null,
  ): void {
    this._onSelectForeignKey = callback;
  }

  public triggerForeignKeySelection(nodeVM: NodeVM): void {
    this._onSelectForeignKey?.(nodeVM);
  }

  public getPatches(): JsonPatch[] {
    return this._engine.getPatches() as JsonPatch[];
  }

  public getRichPatches(): RichPatch[] {
    return this._engine.getRichPatches();
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
