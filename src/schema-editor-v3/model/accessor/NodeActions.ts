import { makeAutoObservable } from 'mobx';
import {
  SystemSchemaIds,
  type SchemaNode,
  type SchemaModel,
  type FieldType,
} from '@revisium/schema-toolkit';

export interface NodeActionsCallbacks {
  renameTable: (name: string) => void;
  onNodeRemoved: (nodeId: string) => void;
  onNodeAdded: (nodeId: string) => void;
  onNodeReplaced: (oldNodeId: string, newNodeId: string) => void;
  selectForeignKey: () => Promise<string | null>;
}

export class NodeActions {
  constructor(
    private readonly _node: SchemaNode,
    private readonly _schemaModel: SchemaModel,
    private readonly _callbacks: NodeActionsCallbacks,
    private readonly _isRoot: boolean,
    private readonly _isReadonly: boolean,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  public get canRemove(): boolean {
    return !this._isReadonly && !this._isRoot;
  }

  public get canAddProperty(): boolean {
    return !this._isReadonly && this._node.isObject();
  }

  public rename(newName: string): void {
    if (this._isReadonly) {
      return;
    }

    if (this._isRoot) {
      this._callbacks.renameTable(newName);
      return;
    }

    if (newName !== this._node.name()) {
      this._schemaModel.renameField(this._node.id(), newName);
    }
  }

  public changeType(typeId: string): void {
    if (this._isReadonly || this._isRoot) {
      return;
    }

    if (typeId === 'ForeignKeyString') {
      this.changeToForeignKey();
      return;
    }

    if (typeId === 'Markdown') {
      this.changeToMarkdown();
      return;
    }

    const refUri = this.typeIdToRefUri(typeId);
    if (refUri) {
      const oldNodeId = this._node.id();
      const newNode = this._schemaModel.changeFieldType(oldNodeId, {
        $ref: refUri,
      });

      if (!newNode.isNull()) {
        this._callbacks.onNodeReplaced(oldNodeId, newNode.id());
      }
      return;
    }

    const fieldType = this.typeIdToFieldType(typeId);
    if (!fieldType) {
      return;
    }

    const oldNodeId = this._node.id();
    const newNode = this._schemaModel.changeFieldType(oldNodeId, fieldType);

    if (!newNode.isNull()) {
      this._schemaModel.updateForeignKey(newNode.id(), undefined);
      this._callbacks.onNodeReplaced(oldNodeId, newNode.id());
    }
  }

  private changeToForeignKey(): void {
    const oldNodeId = this._node.id();
    let nodeId = oldNodeId;

    if (this._node.nodeType() !== 'string') {
      const newNode = this._schemaModel.changeFieldType(oldNodeId, 'string');
      nodeId = newNode.id();
    }

    this._schemaModel.updateForeignKey(nodeId, '');
    this._callbacks.onNodeReplaced(oldNodeId, nodeId);
  }

  private changeToMarkdown(): void {
    const oldNodeId = this._node.id();
    let node = this._node;

    if (node.nodeType() !== 'string') {
      node = this._schemaModel.changeFieldType(oldNodeId, 'string');
    }

    node.setContentMediaType('text/markdown');
    this._callbacks.onNodeReplaced(oldNodeId, node.id());
  }

  public remove(): void {
    if (this._isReadonly || this._isRoot) {
      return;
    }

    const nodeId = this._node.id();
    const removed = this._schemaModel.removeField(nodeId);

    if (removed) {
      this._callbacks.onNodeRemoved(nodeId);
    }
  }

  public addProperty(name: string = ''): SchemaNode | null {
    if (this._isReadonly || !this._node.isObject()) {
      return null;
    }

    const newNode = this._schemaModel.addField(this._node.id(), name, 'string');

    if (!newNode.isNull()) {
      this._callbacks.onNodeAdded(newNode.id());
      return newNode;
    }

    return null;
  }

  public setDescription(description: string | undefined): void {
    if (this._isReadonly) {
      return;
    }
    this._schemaModel.updateMetadata(this._node.id(), {
      description: description || undefined,
    });
  }

  public setDeprecated(deprecated: boolean): void {
    if (this._isReadonly) {
      return;
    }
    this._schemaModel.updateMetadata(this._node.id(), {
      deprecated: deprecated || undefined,
    });
  }

  public setDefaultValue(value: unknown): void {
    if (this._isReadonly) {
      return;
    }
    this._schemaModel.updateDefaultValue(this._node.id(), value);
  }

  public setForeignKey(tableId: string | undefined): void {
    if (this._isReadonly) {
      return;
    }

    if (tableId === undefined) {
      this._schemaModel.updateForeignKey(this._node.id(), undefined);
      return;
    }

    if (this._node.foreignKey() !== undefined) {
      this._schemaModel.updateForeignKey(this._node.id(), tableId);
    } else {
      const oldNodeId = this._node.id();
      if (this._node.nodeType() !== 'string') {
        const newNode = this._schemaModel.changeFieldType(oldNodeId, 'string');
        this._schemaModel.updateForeignKey(newNode.id(), tableId);
        this._callbacks.onNodeReplaced(oldNodeId, newNode.id());
      } else {
        this._schemaModel.updateForeignKey(oldNodeId, tableId);
      }
    }
  }

  public changeItemsType(typeId: string): void {
    if (this._isReadonly || !this._node.isArray()) {
      return;
    }

    const items = this._node.items();
    if (items.isNull()) {
      return;
    }

    const oldNodeId = items.id();

    if (typeId === 'ForeignKeyString') {
      this.changeItemsToForeignKey(items, oldNodeId);
      return;
    }

    if (typeId === 'Markdown') {
      this.changeItemsToMarkdown(items, oldNodeId);
      return;
    }

    const refUri = this.typeIdToRefUri(typeId);
    if (refUri) {
      const newNode = this._schemaModel.changeFieldType(oldNodeId, {
        $ref: refUri,
      });

      if (!newNode.isNull()) {
        this._callbacks.onNodeReplaced(oldNodeId, newNode.id());
      }
      return;
    }

    const fieldType = this.typeIdToFieldType(typeId);
    if (!fieldType) {
      return;
    }

    const newNode = this._schemaModel.changeFieldType(oldNodeId, fieldType);

    if (!newNode.isNull()) {
      this._schemaModel.updateForeignKey(newNode.id(), undefined);
      this._callbacks.onNodeReplaced(oldNodeId, newNode.id());
    }
  }

  private changeItemsToForeignKey(items: SchemaNode, oldNodeId: string): void {
    let nodeId = oldNodeId;

    if (items.nodeType() !== 'string') {
      const newNode = this._schemaModel.changeFieldType(oldNodeId, 'string');
      nodeId = newNode.id();
    }

    this._schemaModel.updateForeignKey(nodeId, '');
    this._callbacks.onNodeReplaced(oldNodeId, nodeId);
  }

  private changeItemsToMarkdown(items: SchemaNode, oldNodeId: string): void {
    let node = items;

    if (items.nodeType() !== 'string') {
      node = this._schemaModel.changeFieldType(oldNodeId, 'string');
    }

    node.setContentMediaType('text/markdown');
    this._callbacks.onNodeReplaced(oldNodeId, node.id());
  }

  public async selectForeignKey(): Promise<void> {
    const tableId = await this._callbacks.selectForeignKey();
    if (tableId !== null) {
      this.setForeignKey(tableId);
    }
  }

  private typeIdToFieldType(typeId: string): FieldType | null {
    const mapping: Record<string, FieldType> = {
      String: 'string',
      Number: 'number',
      Boolean: 'boolean',
      Object: 'object',
      Array: 'array',
    };
    return mapping[typeId] ?? null;
  }

  private typeIdToRefUri(typeId: string): string | null {
    const mapping: Record<string, string> = {
      File: SystemSchemaIds.File,
      RowId: SystemSchemaIds.RowId,
      RowCreatedId: SystemSchemaIds.RowCreatedId,
      RowVersionId: SystemSchemaIds.RowVersionId,
      RowCreatedAt: SystemSchemaIds.RowCreatedAt,
      RowPublishedAt: SystemSchemaIds.RowPublishedAt,
      RowUpdatedAt: SystemSchemaIds.RowUpdatedAt,
      RowHash: SystemSchemaIds.RowHash,
      RowSchemaHash: SystemSchemaIds.RowSchemaHash,
    };
    return mapping[typeId] ?? null;
  }
}
