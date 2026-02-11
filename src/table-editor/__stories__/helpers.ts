import type { ColumnSpec } from '../Columns/model/types.js';
import { FilterFieldType } from '../shared/field-types.js';

export { FilterFieldType } from '../shared/field-types.js';

export function col(
  field: string,
  fieldType: FilterFieldType,
  overrides?: Partial<ColumnSpec>,
): ColumnSpec {
  return {
    field,
    label: field.charAt(0).toUpperCase() + field.slice(1),
    fieldType,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
    ...overrides,
  };
}

export function mockClipboard(initialText = ''): {
  getText: () => string;
  setText: (text: string) => void;
} {
  let clipboardText = initialText;
  const mock = {
    writeText: (text: string) => {
      clipboardText = text;
      return Promise.resolve();
    },
    readText: () => Promise.resolve(clipboardText),
  };
  Object.defineProperty(navigator, 'clipboard', {
    value: mock,
    writable: true,
    configurable: true,
  });
  return {
    getText: () => clipboardText,
    setText: (text: string) => {
      clipboardText = text;
    },
  };
}
