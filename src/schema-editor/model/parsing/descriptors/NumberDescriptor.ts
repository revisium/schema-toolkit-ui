import type {
  TypeDescriptor,
  ParseContext,
  SerializeContext,
} from './TypeDescriptor';
import type { JsonNumberSchema, JsonSchemaType } from '../../schema/JsonSchema';
import type { NodeMetadata } from '../../node/NodeMetadata';
import { NumberNode, type NumberNodeOptions } from '../../node/NumberNode';
import { PRIMITIVE_CAPABILITIES } from './TypeCapabilities';
import { FormulaSerializer } from '../../formula/FormulaSerializer';

function isNumberSchema(schema: JsonSchemaType): schema is JsonNumberSchema {
  return 'type' in schema && schema.type === 'number';
}

export const numberDescriptor: TypeDescriptor<JsonNumberSchema, NumberNode> = {
  type: 'number',

  capabilities: PRIMITIVE_CAPABILITIES,

  canParse: isNumberSchema,

  parse(
    schema: JsonNumberSchema,
    name: string,
    metadata: NodeMetadata,
    context: ParseContext,
  ): NumberNode {
    const options: NumberNodeOptions = {};

    if (schema.default !== undefined) {
      options.defaultValue = schema.default;
    }

    const node = new NumberNode(context.generateId(), name, options);
    node.setMetadata(metadata);

    if (schema['x-formula']?.expression) {
      context.addPendingFormula(node.id(), schema['x-formula'].expression);
    }

    return node;
  },

  serialize(node: NumberNode, _context: SerializeContext): JsonNumberSchema {
    const result: JsonNumberSchema = {
      type: 'number',
      default: node.defaultValue() ?? 0,
    };

    const formula = node.formula();
    if (formula) {
      result.readOnly = true;
      result['x-formula'] = FormulaSerializer.toXFormula(formula);
    }

    return result;
  },

  getDefaultValue(schema: JsonNumberSchema): number {
    return 'default' in schema ? schema.default : 0;
  },

  parseDefaultValueString(valueStr: string): number | undefined {
    if (!valueStr) {
      return undefined;
    }
    const num = Number(valueStr);
    if (!Number.isNaN(num)) {
      return num;
    }
    return undefined;
  },
};
