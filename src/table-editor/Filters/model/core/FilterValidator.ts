import type { createRowModel } from '@revisium/schema-toolkit';
import type { FILTER_SCHEMA } from '../filterSchema.js';
import { FilterConditionVM } from '../vm/FilterConditionVM.js';
import {
  isConditionValueValid,
  getConditionErrorMessage,
} from '../utils/filterValidation.js';

type FilterRowModel = ReturnType<typeof createRowModel<typeof FILTER_SCHEMA>>;

export class FilterValidator {
  constructor(private readonly _row: FilterRowModel) {}

  get allValid(): boolean {
    const rootConditions = this._row.root.child('conditions');
    for (let i = 0; i < rootConditions.length; i++) {
      const item = rootConditions.at(i);
      if (item && !isConditionValueValid(new FilterConditionVM(item))) {
        return false;
      }
    }
    const groups = this._row.root.child('groups');
    for (let gi = 0; gi < groups.length; gi++) {
      const groupConditions = groups.at(gi)?.child('conditions');
      if (groupConditions) {
        for (let ci = 0; ci < groupConditions.length; ci++) {
          const item = groupConditions.at(ci);
          if (item && !isConditionValueValid(new FilterConditionVM(item))) {
            return false;
          }
        }
      }
    }
    return true;
  }

  isConditionValid(id: string): boolean {
    const condNode = this._findConditionNode(id);
    if (!condNode) {
      return false;
    }
    return isConditionValueValid(new FilterConditionVM(condNode));
  }

  getConditionError(id: string): string | null {
    const condNode = this._findConditionNode(id);
    if (!condNode) {
      return null;
    }
    return getConditionErrorMessage(new FilterConditionVM(condNode));
  }

  private _findConditionNode(id: string) {
    const rootConditions = this._row.root.child('conditions');
    for (let i = 0; i < rootConditions.length; i++) {
      const item = rootConditions.at(i);
      if (item?.child('id').value === id) {
        return item;
      }
    }
    const groups = this._row.root.child('groups');
    for (let gi = 0; gi < groups.length; gi++) {
      const groupConditions = groups.at(gi)?.child('conditions');
      if (groupConditions) {
        for (let ci = 0; ci < groupConditions.length; ci++) {
          const item = groupConditions.at(ci);
          if (item?.child('id').value === id) {
            return item;
          }
        }
      }
    }
    return null;
  }
}
