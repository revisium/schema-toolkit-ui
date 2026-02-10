import type { FilterFieldType } from '../../shared/field-types.js';
import type { SystemFieldId } from '../../shared/system-fields.js';

export interface ColumnSpec {
  field: string;
  label: string;
  fieldType: FilterFieldType;
  isSystem: boolean;
  systemFieldId?: SystemFieldId;
  isDeprecated: boolean;
  hasFormula: boolean;
}
