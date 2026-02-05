import { makeAutoObservable } from 'mobx';
import {
  createTableModel,
  type TableModel,
  type SchemaModel,
  type JsonObjectSchema,
  type SchemaPatch,
  type JsonPatch,
  type FieldType,
  type RefSchemas,
  isValidFieldName,
  FIELD_NAME_ERROR_MESSAGE,
} from '@revisium/schema-toolkit';
import { TreeState } from '../state/TreeState';
import { NodeAccessorFactory, type NodeActionsCallbacks } from '../accessor';
import { AccessorCache } from './AccessorCache';
import { ValidationTracker } from './ValidationTracker';
import { ViewState } from './ViewState';
import { CollapseManager } from './CollapseManager';
import { defaultRefSchemas } from '../../config/system-schemas';

const DEFAULT_COLLAPSE_COMPLEXITY = 14;

export type ForeignKeySelectionCallback = () => Promise<string | null>;

export interface SchemaEditorCoreOptions {
  tableId?: string;
  refSchemas?: RefSchemas;
  collapseComplexSchemas?: boolean;
  collapseComplexity?: number;
  onCancel?: () => void;
  onSelectForeignKey?: ForeignKeySelectionCallback;
}

export class SchemaEditorCore {
  private readonly _tableModel: TableModel;
  private readonly _treeState: TreeState;
  private readonly _onCancel: (() => void) | null;
  private readonly _onSelectForeignKey: ForeignKeySelectionCallback | null;

  public readonly accessors: AccessorCache;
  public readonly validation: ValidationTracker;
  public readonly view: ViewState;
  public readonly collapse: CollapseManager;

  constructor(
    jsonSchema: JsonObjectSchema,
    options: SchemaEditorCoreOptions = {},
    accessorFactory: NodeAccessorFactory = new NodeAccessorFactory(),
  ) {
    this._tableModel = createTableModel({
      tableId: options.tableId ?? '',
      schema: jsonSchema,
      refSchemas: options.refSchemas ?? defaultRefSchemas,
    });

    this._treeState = new TreeState();
    this._onCancel = options.onCancel ?? null;
    this._onSelectForeignKey = options.onSelectForeignKey ?? null;

    const callbacks: NodeActionsCallbacks = {
      renameTable: this.setTableId.bind(this),
      onNodeRemoved: this.handleNodeRemoved.bind(this),
      onNodeAdded: this.handleNodeAdded.bind(this),
      onNodeReplaced: this.handleNodeReplaced.bind(this),
      selectForeignKey: this.selectForeignKey.bind(this),
    };

    this.accessors = new AccessorCache(
      () => this._tableModel.schema,
      () => ({
        schemaModel: this._tableModel.schema,
        treeState: this._treeState,
        getTableId: () => this._tableModel.tableId,
        getTableIdError: () => this.tableIdError,
        callbacks,
      }),
      accessorFactory,
    );

    this.validation = new ValidationTracker(
      this._tableModel,
      this.accessors,
      () => this.tableIdError,
    );

    this.view = new ViewState();
    this.collapse = new CollapseManager(
      this._treeState,
      () => this._tableModel.schema,
    );

    const shouldCollapse = options.collapseComplexSchemas ?? false;
    const complexity =
      options.collapseComplexity ?? DEFAULT_COLLAPSE_COMPLEXITY;
    if (shouldCollapse) {
      this.collapse.collapseIfComplex(complexity);
    }

    this.collapse.collapseRefNodes();

    makeAutoObservable(
      this,
      {
        accessors: false,
        validation: false,
        view: false,
        collapse: false,
      },
      { autoBind: true },
    );
  }

  public get tableModel(): TableModel {
    return this._tableModel;
  }

  public get schemaModel(): SchemaModel {
    return this._tableModel.schema;
  }

  public get treeState(): TreeState {
    return this._treeState;
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

  public get rootAccessor() {
    return this.accessors.get(this._tableModel.schema.root.id(), true);
  }

  public get isDirty(): boolean {
    return this._tableModel.isDirty;
  }

  public get isValid(): boolean {
    return this._tableModel.schema.isValid && this.tableIdError === null;
  }

  public get patchesCount(): number {
    return this.getPatches().length;
  }

  public get totalChangesCount(): number {
    return this.patchesCount + (this.isTableIdChanged ? 1 : 0);
  }

  public markAsSaved(): void {
    this._tableModel.commit();
    this.accessors.clear();
  }

  public changeRootType(typeId: string): void {
    const currentRoot = this._tableModel.schema.root;
    if (currentRoot.isNull()) {
      return;
    }

    if (typeId === 'Array' && !currentRoot.isArray()) {
      const result = this._tableModel.schema.wrapRootInArray();
      if (result) {
        this.accessors.clear();
      }
      return;
    }

    const fieldType = this.typeIdToFieldType(typeId);
    if (fieldType) {
      const result = this._tableModel.schema.replaceRoot(fieldType);
      if (result) {
        this.accessors.clear();
      }
    }
  }

  public async selectForeignKey(): Promise<string | null> {
    if (!this._onSelectForeignKey) {
      return null;
    }
    return this._onSelectForeignKey();
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

  public typeIdToFieldType(typeId: string): FieldType | null {
    const mapping: Record<string, FieldType> = {
      String: 'string',
      Number: 'number',
      Boolean: 'boolean',
      Object: 'object',
      Array: 'array',
    };
    return mapping[typeId] ?? null;
  }

  public moveNode(fromNodeId: string, toParentId: string): void {
    this._tableModel.schema.moveNode(fromNodeId, toParentId);
    this.accessors.delete(fromNodeId);
  }

  public revert(): void {
    this._tableModel.revert();
    this.accessors.clear();
    this._treeState.reset();
  }

  public dispose(): void {
    this.accessors.clear();
    this._treeState.reset();
  }

  private handleNodeRemoved(nodeId: string): void {
    this.accessors.delete(nodeId);
    this._treeState.clearNode(nodeId);
  }

  private handleNodeAdded(nodeId: string): void {
    this.collapseIfRefNode(nodeId);
  }

  private handleNodeReplaced(oldNodeId: string, newNodeId: string): void {
    this.accessors.delete(oldNodeId);
    this._treeState.clearNode(oldNodeId);
    this.collapseIfRefNode(newNodeId);
  }

  private collapseIfRefNode(nodeId: string): void {
    const node = this._tableModel.schema.nodeById(nodeId);
    if (node.isRef() && (node.isObject() || node.isArray())) {
      this._treeState.setExpanded(nodeId, false);
    }
  }
}
