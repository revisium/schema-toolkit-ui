import {
  PiPlusLight,
  PiMinusLight,
  PiArrowsLeftRightLight,
  PiPencilSimpleLight,
} from 'react-icons/pi';
import { IconType } from 'react-icons';
import { jsonPointerToSimplePath } from '@revisium/schema-toolkit';
import type { SchemaPatch } from '@revisium/schema-toolkit';

export type PatchOp = 'add' | 'remove' | 'move' | 'replace';

export const operationIcons: Record<PatchOp, IconType> = {
  add: PiPlusLight,
  remove: PiMinusLight,
  move: PiArrowsLeftRightLight,
  replace: PiPencilSimpleLight,
};

export const formatDefaultValue = (value: unknown): string => {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2);
  }
  return JSON.stringify(value);
};

export const formatChangeValue = (value: unknown): string => {
  if (value === undefined) {
    return '(none)';
  }
  if (typeof value === 'string') {
    return value || '(none)';
  }
  return JSON.stringify(value);
};

export const getFromFieldName = (patch: SchemaPatch['patch']): string => {
  if (patch.op === 'move' && patch.from) {
    return jsonPointerToSimplePath(patch.from);
  }
  return '';
};
