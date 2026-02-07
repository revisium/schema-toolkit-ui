import type { NodeAccessor } from '../../../model/accessor';

export function parseDefaultValue(
  value: string,
  accessor: NodeAccessor,
): unknown {
  const nodeType = accessor.label.nodeType;
  if (nodeType === 'number') {
    const num = Number(value);
    return Number.isNaN(num) ? 0 : num;
  }
  if (nodeType === 'boolean') {
    return value === 'true';
  }
  return value;
}
