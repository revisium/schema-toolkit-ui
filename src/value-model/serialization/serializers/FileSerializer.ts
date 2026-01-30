import type { ValueNode } from '../../node/types';
import type { Serializer } from '../types';

export class FileSerializer implements Serializer {
  serialize(node: ValueNode): unknown {
    if (!node.isObject()) {
      return null;
    }

    const fileId = node.child('fileId')?.getPlainValue();
    const url = node.child('url')?.getPlainValue();
    const status = node.child('status')?.getPlainValue();

    return {
      fileId: fileId ?? '',
      url: url ?? '',
      status: status ?? 'ready',
    };
  }
}
