import { makeAutoObservable } from 'mobx';
import {
  type TableModel,
  type JsonObjectSchema,
} from '@revisium/schema-toolkit';

export type CreateTableViewMode = 'Example' | 'Schema';

export class CreateTableDialogVM {
  private _viewMode: CreateTableViewMode = 'Example';
  private _loading = false;

  constructor(
    private readonly _tableModel: TableModel,
    private readonly _onApprove: () => Promise<void>,
    private readonly _onClose: () => void,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  public get tableId(): string {
    return this._tableModel.tableId;
  }

  public get viewMode(): CreateTableViewMode {
    return this._viewMode;
  }

  public setViewMode(mode: CreateTableViewMode): void {
    this._viewMode = mode;
  }

  public get loading(): boolean {
    return this._loading;
  }

  public get plainSchema(): JsonObjectSchema {
    return this._tableModel.schema.plainSchema;
  }

  public get exampleData(): unknown {
    return this._tableModel.schema.generateDefaultValue({ arrayItemCount: 1 });
  }

  public async approve(): Promise<void> {
    this._loading = true;
    try {
      await this._onApprove();
    } finally {
      this._loading = false;
    }
  }

  public close(): void {
    this._onClose();
  }
}
