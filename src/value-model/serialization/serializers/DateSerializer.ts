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
      if (!Number.isFinite(value)) {
        return null;
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString();
    }

    return null;
  }
}
