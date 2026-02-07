import { makeAutoObservable } from 'mobx';
import type { SchemaModel } from '@revisium/schema-toolkit';
import type { SchemaEditorCore } from '../core';
import type { KeyboardNavigation } from '../core/KeyboardNavigation';
import type { NodeAccessor } from '../accessor';

export class SchemaTreeVM {
  constructor(private readonly _core: SchemaEditorCore) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  public get rootAccessor(): NodeAccessor {
    return this._core.rootAccessor;
  }

  public get schemaModel(): SchemaModel {
    return this._core.schemaModel;
  }

  public getChildAccessors(
    nodeId: string,
    parentIsReadonly: boolean = false,
  ): NodeAccessor[] {
    return this._core.accessors.getChildren(nodeId, parentIsReadonly);
  }

  public changeRootType(typeId: string): void {
    this._core.changeRootType(typeId);
  }

  public changeNodeType(accessor: NodeAccessor, typeId: string): void {
    if (accessor.isRoot) {
      this._core.changeRootType(typeId);
    } else {
      accessor.actions.changeType(typeId);
    }
  }

  public moveNode(fromNodeId: string, toParentId: string): void {
    this._core.moveNode(fromNodeId, toParentId);
  }

  public selectForeignKey(): Promise<string | null> {
    return this._core.selectForeignKey();
  }

  public get keyboard(): KeyboardNavigation {
    return this._core.keyboard;
  }
}
