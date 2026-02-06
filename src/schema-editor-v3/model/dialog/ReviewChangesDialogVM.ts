import { makeAutoObservable, runInAction } from 'mobx';
import type {
  TableModel,
  SchemaPatch,
  JsonPatch,
} from '@revisium/schema-toolkit';

export type ReviewChangesViewMode = 'Changes' | 'Patches';

export interface TableIdChangeInfo {
  initialTableId: string;
  currentTableId: string;
}

export class ReviewChangesDialogVM {
  private _viewMode: ReviewChangesViewMode = 'Changes';
  private _loading = false;

  constructor(
    private readonly _tableModel: TableModel,
    private readonly _onApprove: () => Promise<void>,
    private readonly _onRevert: () => void,
    private readonly _onClose: () => void,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
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

  public get tableIdChange(): TableIdChangeInfo | null {
    if (!this.isTableIdChanged) {
      return null;
    }
    return {
      initialTableId: this.initialTableId,
      currentTableId: this.tableId,
    };
  }

  public get patches(): SchemaPatch[] {
    return this._tableModel.schema.patches;
  }

  public get jsonPatches(): JsonPatch[] {
    return this._tableModel.schema.jsonPatches;
  }

  public get patchesCount(): number {
    return this.patches.length;
  }

  public get totalChangesCount(): number {
    return this.patchesCount + (this.isTableIdChanged ? 1 : 0);
  }

  public get hasChanges(): boolean {
    return this.patchesCount > 0 || this.isTableIdChanged;
  }

  public get viewMode(): ReviewChangesViewMode {
    return this._viewMode;
  }

  public setViewMode(mode: ReviewChangesViewMode): void {
    this._viewMode = mode;
  }

  public get loading(): boolean {
    return this._loading;
  }

  public async approve(): Promise<void> {
    this._loading = true;
    try {
      await this._onApprove();
    } finally {
      runInAction(() => {
        this._loading = false;
      });
    }
  }

  public revert(): void {
    this._onRevert();
    this._onClose();
  }

  public close(): void {
    this._onClose();
  }
}
