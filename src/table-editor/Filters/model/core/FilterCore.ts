import { makeAutoObservable } from 'mobx';
import { createRowModel } from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import type { ColumnSpec } from '../../../Columns/model/types.js';
import type { FilterConditionVM } from '../vm/FilterConditionVM.js';
import { FilterGroupVM } from '../vm/FilterGroupVM.js';
import { FILTER_SCHEMA, type FilterData } from '../filterSchema.js';
import type { FilterGroup } from '../types.js';
import { FilterTreeOps } from './FilterTreeOps.js';
import { FilterSerializer } from './FilterSerializer.js';
import { FilterValidator } from './FilterValidator.js';

type FilterRowModel = ReturnType<typeof createRowModel<typeof FILTER_SCHEMA>>;

export class FilterCore {
  private readonly _row: FilterRowModel;
  private readonly _treeOps: FilterTreeOps;
  private readonly _serializer: FilterSerializer;
  private readonly _validator: FilterValidator;

  private _availableFields: ColumnSpec[] = [];
  private _onChange: (() => void) | null = null;
  private _onApply: ((where: Record<string, unknown> | null) => void) | null =
    null;
  private _isOpen = false;
  private _committedHasFilters = false;

  constructor() {
    ensureReactivityProvider();

    const emptyData = FilterCore._emptyFilterData();
    this._row = createRowModel<typeof FILTER_SCHEMA>({
      rowId: 'filter',
      schema: FILTER_SCHEMA,
      data: emptyData,
    });

    this._treeOps = new FilterTreeOps(this._row, () => this._availableFields);
    this._serializer = new FilterSerializer(this._row);
    this._validator = new FilterValidator(this._row);

    makeAutoObservable(this, {}, { autoBind: true });
  }

  private static _emptyFilterData(): FilterData {
    return {
      id: 'g-1',
      logic: 'and',
      conditions: [],
      groups: [],
      nextConditionId: 1,
      nextGroupId: 2,
    };
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  setOpen(value: boolean): void {
    this._isOpen = value;
  }

  get rootGroup(): FilterGroupVM {
    return new FilterGroupVM(this._row.root, true);
  }

  get hasPendingChanges(): boolean {
    return this._row.isDirty;
  }

  get totalConditionCount(): number {
    return this._treeOps.countConditions();
  }

  get hasActiveFilters(): boolean {
    return this._committedHasFilters;
  }

  get allFiltersValid(): boolean {
    return this._validator.allValid;
  }

  get isEmpty(): boolean {
    return this._treeOps.isEmpty();
  }

  get showBadge(): boolean {
    return this.totalConditionCount > 0 || this.hasActiveFilters;
  }

  buildCurrentWhereClause(): Record<string, unknown> | null {
    return this._serializer.buildCurrentWhereClause();
  }

  init(availableFields: ColumnSpec[]): void {
    this._availableFields = availableFields;
    this._row.reset(FilterCore._emptyFilterData());
    this._committedHasFilters = false;
  }

  addCondition(groupId?: string): void {
    this._treeOps.addCondition(groupId);
    this._notifyChange();
  }

  addConditionForField(field: string): void {
    this._treeOps.addConditionForField(field);
    this._notifyChange();
  }

  updateCondition(
    id: string,
    updates: Partial<
      Pick<
        FilterConditionVM,
        'field' | 'operator' | 'value' | 'searchLanguage' | 'searchType'
      >
    >,
  ): void {
    this._treeOps.updateCondition(id, updates);
    this._notifyChange();
  }

  removeCondition(id: string): void {
    this._treeOps.removeCondition(id);
    this._notifyChange();
  }

  addGroup(): void {
    this._treeOps.addGroup();
    this._notifyChange();
  }

  removeGroup(id: string): void {
    this._treeOps.removeGroup(id);
    this._notifyChange();
  }

  setGroupLogic(id: string, logic: 'and' | 'or'): void {
    this._treeOps.setGroupLogic(id, logic);
    this._notifyChange();
  }

  apply(): void {
    this._treeOps.removeEmptyGroups();
    this._row.commit();
    this._committedHasFilters = !this.isEmpty;
    this._fireOnApply();
    this._notifyChange();
  }

  applyAndClose(): void {
    this.apply();
    this.setOpen(false);
  }

  reset(): void {
    this._row.revert();
    this._notifyChange();
  }

  applySnapshot(serialized: string): void {
    const hasFilters = this._serializer.applySnapshot(serialized);
    this._committedHasFilters = hasFilters;
    this._notifyChange();
  }

  clearAll(): void {
    this._row.reset(FilterCore._emptyFilterData());
    this._committedHasFilters = false;
    this._fireOnApply();
    this._notifyChange();
  }

  clearAllAndClose(): void {
    this.clearAll();
    this.setOpen(false);
  }

  isConditionValid(id: string): boolean {
    return this._validator.isConditionValid(id);
  }

  getConditionError(id: string): string | null {
    return this._validator.getConditionError(id);
  }

  serializeRootGroup(): FilterGroup {
    return this._serializer.serializeRootGroup();
  }

  setOnChange(cb: (() => void) | null): void {
    this._onChange = cb;
  }

  setOnApply(
    cb: ((where: Record<string, unknown> | null) => void) | null,
  ): void {
    this._onApply = cb;
  }

  dispose(): void {
    this._onChange = null;
    this._onApply = null;
    this._row.dispose();
  }

  private _fireOnApply(): void {
    if (this._onApply) {
      const where = this._serializer.buildCurrentWhereClause();
      this._onApply(where);
    }
  }

  private _notifyChange(): void {
    if (this._onChange) {
      this._onChange();
    }
  }
}
