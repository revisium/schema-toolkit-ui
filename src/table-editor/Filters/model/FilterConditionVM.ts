import type { FilterFieldType } from '../../shared/field-types.js';
import type { FilterOperator } from './operators.js';
import type { SearchLanguage, SearchType } from './searchTypes.js';
import type { ConditionNode } from './filterSchema.js';

export class FilterConditionVM {
  constructor(private readonly _node: ConditionNode) {}

  get id(): string {
    return this._node.child('id').value;
  }

  get field(): string {
    return this._node.child('field').value;
  }

  get fieldType(): FilterFieldType {
    return this._node.child('fieldType').value as FilterFieldType;
  }

  get operator(): FilterOperator {
    return this._node.child('operator').value as FilterOperator;
  }

  get value(): string {
    return this._node.child('value').value;
  }

  get searchLanguage(): SearchLanguage {
    return this._node.child('searchLanguage').value as SearchLanguage;
  }

  get searchType(): SearchType {
    return this._node.child('searchType').value as SearchType;
  }
}
