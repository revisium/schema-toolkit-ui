import { nanoid } from 'nanoid';
import { StringNode, type ContentMediaType } from '../node/StringNode';
import { NumberNode } from '../node/NumberNode';
import { BooleanNode } from '../node/BooleanNode';
import { ObjectNode } from '../node/ObjectNode';
import { ArrayNode } from '../node/ArrayNode';
import { RefNode } from '../node/RefNode';
import type { SchemaNode } from '../node/SchemaNode';

export interface StringNodeFactoryOptions {
  foreignKey?: string;
  contentMediaType?: ContentMediaType;
}

export interface RefNodeOptions {
  $ref: string;
}

export class NodeFactory {
  static string(name: string, options?: StringNodeFactoryOptions): StringNode {
    const node = new StringNode(nanoid(), name);
    if (options?.foreignKey !== undefined) {
      node.setForeignKey(options.foreignKey);
    }
    if (options?.contentMediaType !== undefined) {
      node.setContentMediaType(options.contentMediaType);
    }
    return node;
  }

  static number(name: string): NumberNode {
    return new NumberNode(nanoid(), name);
  }

  static boolean(name: string): BooleanNode {
    return new BooleanNode(nanoid(), name);
  }

  static object(name: string, children: SchemaNode[] = []): ObjectNode {
    return new ObjectNode(nanoid(), name, children);
  }

  static array(name: string, items: SchemaNode): ArrayNode {
    return new ArrayNode(nanoid(), name, items);
  }

  static ref(name: string, options: RefNodeOptions): RefNode {
    return new RefNode(nanoid(), name, options.$ref);
  }
}
