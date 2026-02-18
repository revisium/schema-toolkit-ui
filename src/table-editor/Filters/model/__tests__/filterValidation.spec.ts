import { FilterFieldType } from '../../../shared/field-types';
import { FilterOperator } from '../operators';
import {
  getConditionErrorMessage,
  isConditionValueValid,
  validateGroup,
} from '../filterValidation';
import type { FilterCondition, FilterGroup } from '../types';

function cond(overrides: Partial<FilterCondition> = {}): FilterCondition {
  return {
    id: 'c-1',
    field: 'name',
    fieldType: FilterFieldType.String,
    operator: FilterOperator.Equals,
    value: 'test',
    ...overrides,
  };
}

function group(overrides: Partial<FilterGroup> = {}): FilterGroup {
  return {
    id: 'g-1',
    logic: 'and',
    conditions: [],
    groups: [],
    ...overrides,
  };
}

describe('isConditionValueValid', () => {
  it('returns true for unary operator IsEmpty', () => {
    expect(
      isConditionValueValid(cond({ operator: FilterOperator.IsEmpty, value: '' })),
    ).toBe(true);
  });

  it('returns true for unary operator IsNotEmpty', () => {
    expect(
      isConditionValueValid(cond({ operator: FilterOperator.IsNotEmpty, value: '' })),
    ).toBe(true);
  });

  it('returns true for unary operator IsTrue', () => {
    expect(
      isConditionValueValid(
        cond({
          fieldType: FilterFieldType.Boolean,
          operator: FilterOperator.IsTrue,
          value: '',
        }),
      ),
    ).toBe(true);
  });

  it('returns true for unary operator IsFalse', () => {
    expect(
      isConditionValueValid(
        cond({
          fieldType: FilterFieldType.Boolean,
          operator: FilterOperator.IsFalse,
          value: '',
        }),
      ),
    ).toBe(true);
  });

  it('returns false when value is empty string', () => {
    expect(isConditionValueValid(cond({ value: '' }))).toBe(false);
  });

  it('returns true for valid number value', () => {
    expect(
      isConditionValueValid(
        cond({ fieldType: FilterFieldType.Number, value: '42' }),
      ),
    ).toBe(true);
  });

  it('returns true for negative number value', () => {
    expect(
      isConditionValueValid(
        cond({ fieldType: FilterFieldType.Number, value: '-3.14' }),
      ),
    ).toBe(true);
  });

  it('returns false for invalid number value', () => {
    expect(
      isConditionValueValid(
        cond({ fieldType: FilterFieldType.Number, value: 'abc' }),
      ),
    ).toBe(false);
  });

  it('returns true for valid datetime value', () => {
    expect(
      isConditionValueValid(
        cond({
          fieldType: FilterFieldType.DateTime,
          value: '2024-01-15T10:30:00.000Z',
        }),
      ),
    ).toBe(true);
  });

  it('returns false for invalid datetime value', () => {
    expect(
      isConditionValueValid(
        cond({ fieldType: FilterFieldType.DateTime, value: 'not-a-date' }),
      ),
    ).toBe(false);
  });

  it('returns true for non-empty string value', () => {
    expect(
      isConditionValueValid(
        cond({ fieldType: FilterFieldType.String, value: 'hello' }),
      ),
    ).toBe(true);
  });

  it('returns true for non-empty foreignKey value', () => {
    expect(
      isConditionValueValid(
        cond({ fieldType: FilterFieldType.ForeignKey, value: 'ref-1' }),
      ),
    ).toBe(true);
  });
});

describe('validateGroup', () => {
  it('returns true for empty group', () => {
    expect(validateGroup(group())).toBe(true);
  });

  it('returns true when all conditions are valid', () => {
    expect(
      validateGroup(
        group({
          conditions: [
            cond({ id: 'c-1', value: 'Alice' }),
            cond({ id: 'c-2', value: 'Bob' }),
          ],
        }),
      ),
    ).toBe(true);
  });

  it('returns false when one condition is invalid', () => {
    expect(
      validateGroup(
        group({
          conditions: [
            cond({ id: 'c-1', value: 'Alice' }),
            cond({ id: 'c-2', value: '' }),
          ],
        }),
      ),
    ).toBe(false);
  });

  it('returns false when nested group has invalid condition', () => {
    expect(
      validateGroup(
        group({
          conditions: [cond({ value: 'ok' })],
          groups: [
            group({
              id: 'g-2',
              conditions: [
                cond({
                  id: 'c-2',
                  fieldType: FilterFieldType.Number,
                  value: 'not-a-number',
                }),
              ],
            }),
          ],
        }),
      ),
    ).toBe(false);
  });

  it('returns true when nested groups are all valid', () => {
    expect(
      validateGroup(
        group({
          conditions: [cond({ value: 'ok' })],
          groups: [
            group({
              id: 'g-2',
              conditions: [cond({ id: 'c-2', value: 'nested-ok' })],
            }),
          ],
        }),
      ),
    ).toBe(true);
  });
});

describe('getConditionErrorMessage', () => {
  it('returns null for unary operator', () => {
    expect(
      getConditionErrorMessage(cond({ operator: FilterOperator.IsEmpty, value: '' })),
    ).toBeNull();
  });

  it('returns "Value is required" when value is empty', () => {
    expect(getConditionErrorMessage(cond({ value: '' }))).toBe(
      'Value is required',
    );
  });

  it('returns "Value must be a number" for invalid number', () => {
    expect(
      getConditionErrorMessage(
        cond({ fieldType: FilterFieldType.Number, value: 'xyz' }),
      ),
    ).toBe('Value must be a number');
  });

  it('returns null for valid number', () => {
    expect(
      getConditionErrorMessage(
        cond({ fieldType: FilterFieldType.Number, value: '99' }),
      ),
    ).toBeNull();
  });

  it('returns "Value must be a valid date" for invalid datetime', () => {
    expect(
      getConditionErrorMessage(
        cond({ fieldType: FilterFieldType.DateTime, value: 'bad-date' }),
      ),
    ).toBe('Value must be a valid date');
  });

  it('returns null for valid datetime', () => {
    expect(
      getConditionErrorMessage(
        cond({
          fieldType: FilterFieldType.DateTime,
          value: '2024-06-01T00:00:00.000Z',
        }),
      ),
    ).toBeNull();
  });

  it('returns null for valid string condition', () => {
    expect(
      getConditionErrorMessage(
        cond({ fieldType: FilterFieldType.String, value: 'hello' }),
      ),
    ).toBeNull();
  });
});
