import { NodeType } from '../node/NodeType';
import { defaultRegistry } from '../types/index';

export type ParsedDefaultValue = string | number | boolean | undefined;

export function parseDefaultValue(
  valueStr: string,
  nodeType: NodeType,
): ParsedDefaultValue {
  if (!valueStr) {
    return undefined;
  }

  const descriptor = defaultRegistry.getDescriptor(nodeType);
  if (descriptor) {
    return descriptor.parseDefaultValueString(valueStr) as ParsedDefaultValue;
  }

  return undefined;
}
