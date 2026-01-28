import type {
  TypeDescriptor,
  ParseContext,
  SerializeContext,
} from './TypeDescriptor';
import type { JsonArraySchema, JsonSchemaType } from '../../schema/JsonSchema';
import type { NodeMetadata } from '../../node/NodeMetadata';
import { ArrayNode } from '../../node/ArrayNode';
import { ARRAY_CAPABILITIES } from './TypeCapabilities';

function isArraySchema(schema: JsonSchemaType): schema is JsonArraySchema {
  return 'type' in schema && schema.type === 'array';
}

export const arrayDescriptor: TypeDescriptor<JsonArraySchema, ArrayNode> = {
  type: 'array',

  capabilities: ARRAY_CAPABILITIES,

  canParse: isArraySchema,

  parse(
    schema: JsonArraySchema,
    name: string,
    metadata: NodeMetadata,
    context: ParseContext,
  ): ArrayNode {
    const items = context.parseNode(schema.items, '');
    const node = new ArrayNode(context.generateId(), name, items);
    node.setMetadata(metadata);
    return node;
  },

  serialize(node: ArrayNode, context: SerializeContext): JsonArraySchema {
    const items = node.items();

    return {
      type: 'array',
      items: items.isNull()
        ? { type: 'string', default: '' }
        : context.serialize(items),
    };
  },

  getDefaultValue(_schema: JsonArraySchema): unknown[] {
    return [];
  },

  parseDefaultValueString(_valueStr: string): undefined {
    return undefined;
  },
};
