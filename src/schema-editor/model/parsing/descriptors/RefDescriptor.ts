import type {
  TypeDescriptor,
  ParseContext,
  SerializeContext,
} from './TypeDescriptor';
import type { JsonRefSchema, JsonSchemaType } from '../../schema/JsonSchema';
import type { NodeMetadata } from '../../node/NodeMetadata';
import { RefNode } from '../../node/RefNode';
import { REF_CAPABILITIES } from './TypeCapabilities';

function isRefSchema(schema: JsonSchemaType): schema is JsonRefSchema {
  return '$ref' in schema;
}

export const refDescriptor: TypeDescriptor<JsonRefSchema, RefNode> = {
  type: 'ref',

  capabilities: REF_CAPABILITIES,

  canParse: isRefSchema,

  parse(
    schema: JsonRefSchema,
    name: string,
    metadata: NodeMetadata,
    context: ParseContext,
  ): RefNode {
    const node = new RefNode(context.generateId(), name, schema.$ref);
    node.setMetadata(metadata);
    return node;
  },

  serialize(node: RefNode, _context: SerializeContext): JsonRefSchema {
    const result: JsonRefSchema = {
      $ref: node.ref(),
    };

    const meta = node.metadata();
    if (meta.title) {
      result.title = meta.title;
    }
    if (meta.description) {
      result.description = meta.description;
    }
    if (meta.deprecated) {
      result.deprecated = meta.deprecated;
    }

    return result;
  },

  getDefaultValue(_schema: JsonRefSchema): null {
    return null;
  },

  parseDefaultValueString(_valueStr: string): undefined {
    return undefined;
  },
};
