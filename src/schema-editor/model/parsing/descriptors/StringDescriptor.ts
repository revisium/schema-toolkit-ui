import type {
  TypeDescriptor,
  ParseContext,
  SerializeContext,
} from './TypeDescriptor';
import type { JsonStringSchema, JsonSchemaType } from '../../schema/JsonSchema';
import type { NodeMetadata } from '../../node/NodeMetadata';
import {
  StringNode,
  type StringNodeOptions,
  type StringFormat,
  type ContentMediaType,
} from '../../node/StringNode';
import { PRIMITIVE_CAPABILITIES } from './TypeCapabilities';

function isStringSchema(schema: JsonSchemaType): schema is JsonStringSchema {
  return 'type' in schema && schema.type === 'string';
}

export const stringDescriptor: TypeDescriptor<JsonStringSchema, StringNode> = {
  type: 'string',

  capabilities: PRIMITIVE_CAPABILITIES,

  canParse: isStringSchema,

  parse(
    schema: JsonStringSchema,
    name: string,
    metadata: NodeMetadata,
    context: ParseContext,
  ): StringNode {
    const options: StringNodeOptions = {};

    if (schema.default !== undefined) {
      options.defaultValue = schema.default;
    }
    if (schema.foreignKey) {
      options.foreignKey = schema.foreignKey;
    }
    if (schema.format) {
      options.format = schema.format as StringFormat;
    }
    if (schema.contentMediaType) {
      options.contentMediaType = schema.contentMediaType as ContentMediaType;
    }
    if (schema.enum && schema.enum.length > 0) {
      options.enumValues = schema.enum;
    }

    const node = new StringNode(context.generateId(), name, options);
    node.setMetadata(metadata);

    if (schema['x-formula']?.expression) {
      context.addPendingFormula(node.id(), schema['x-formula'].expression);
    }

    return node;
  },

  serialize(node: StringNode, context: SerializeContext): JsonStringSchema {
    const result: JsonStringSchema = {
      type: 'string',
      default: node.defaultValue() ?? '',
    };

    if (node.foreignKey()) {
      result.foreignKey = node.foreignKey();
    }
    if (node.format()) {
      result.format = node.format();
    }
    if (node.contentMediaType()) {
      result.contentMediaType = node.contentMediaType();
    }
    const enumValues = node.enumValues();
    if (enumValues && enumValues.length > 0) {
      result.enum = [...enumValues];
    }
    const formula = node.formula();
    if (formula) {
      result.readOnly = true;
      result['x-formula'] = context.serializeFormula(node.id(), formula);
    }

    return result;
  },

  getDefaultValue(schema: JsonStringSchema): string {
    return 'default' in schema ? schema.default : '';
  },

  parseDefaultValueString(valueStr: string): string {
    return valueStr;
  },
};
