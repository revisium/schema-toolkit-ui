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
  isSortable: boolean;
  foreignKeyTableId?: string;
  parentFileField?: string;
}

export type PinSide = 'left' | 'right';

export interface ViewColumn {
  field: string;
  width?: number;
  pinned?: PinSide;
}
