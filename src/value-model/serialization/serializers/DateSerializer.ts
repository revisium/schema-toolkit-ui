import type { ValueNode } from '../../node/types';
import type { Serializer } from '../types';

export class DateSerializer implements Serializer {
  serialize(node: ValueNode): unknown {
    if (!node.isPrimitive()) {
      return null;
    }

    const value = node.value;

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number') {
      return new Date(value).toISOString();
    }

    return null;
  }
}
