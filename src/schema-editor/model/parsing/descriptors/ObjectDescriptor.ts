import type {
  TypeDescriptor,
  ParseContext,
  SerializeContext,
} from './TypeDescriptor';
import type { JsonObjectSchema, JsonSchemaType } from '../../schema/JsonSchema';
import type { NodeMetadata } from '../../node/NodeMetadata';
import type { SchemaNode } from '../../node/SchemaNode';
import { ObjectNode } from '../../node/ObjectNode';
import { OBJECT_CAPABILITIES } from './TypeCapabilities';

function isObjectSchema(schema: JsonSchemaType): schema is JsonObjectSchema {
  return 'type' in schema && schema.type === 'object';
}

export const objectDescriptor: TypeDescriptor<JsonObjectSchema, ObjectNode> = {
  type: 'object',

  capabilities: OBJECT_CAPABILITIES,

  canParse: isObjectSchema,

  parse(
    schema: JsonObjectSchema,
    name: string,
    metadata: NodeMetadata,
    context: ParseContext,
  ): ObjectNode {
    const children: SchemaNode[] = [];

    const orderedKeys = schema.required ?? Object.keys(schema.properties);

    for (const propName of orderedKeys) {
      const propSchema = schema.properties[propName];
      if (propSchema) {
        children.push(context.parseNode(propSchema, propName));
      }
    }

    const node = new ObjectNode(context.generateId(), name, children);
    node.setMetadata(metadata);
    return node;
  },

  serialize(node: ObjectNode, context: SerializeContext): JsonObjectSchema {
    const properties: Record<string, JsonSchemaType> = {};
    const required: string[] = [];

    for (const child of node.properties()) {
      const childName = child.name();
      properties[childName] = context.serialize(child);
      required.push(childName);
    }

    return {
      type: 'object',
      required,
      properties,
      additionalProperties: false,
    };
  },

  getDefaultValue(_schema: JsonObjectSchema): Record<string, unknown> {
    return {};
  },

  parseDefaultValueString(_valueStr: string): undefined {
    return undefined;
  },
};
