import type {
  TypeDescriptor,
  ParseContext,
  SerializeContext,
} from './TypeDescriptor';
import type {
  JsonBooleanSchema,
  JsonSchemaType,
} from '../../schema/JsonSchema';
import type { NodeMetadata } from '../../node/NodeMetadata';
import { BooleanNode, type BooleanNodeOptions } from '../../node/BooleanNode';
import { PRIMITIVE_CAPABILITIES } from './TypeCapabilities';
import { FormulaSerializer } from '../../formula/FormulaSerializer';

function isBooleanSchema(schema: JsonSchemaType): schema is JsonBooleanSchema {
  return 'type' in schema && schema.type === 'boolean';
}

export const booleanDescriptor: TypeDescriptor<JsonBooleanSchema, BooleanNode> =
  {
    type: 'boolean',

    capabilities: PRIMITIVE_CAPABILITIES,

    canParse: isBooleanSchema,

    parse(
      schema: JsonBooleanSchema,
      name: string,
      metadata: NodeMetadata,
      context: ParseContext,
    ): BooleanNode {
      const options: BooleanNodeOptions = {};

      if (schema.default !== undefined) {
        options.defaultValue = schema.default;
      }

      const node = new BooleanNode(context.generateId(), name, options);
      node.setMetadata(metadata);

      if (schema['x-formula']?.expression) {
        context.addPendingFormula(node.id(), schema['x-formula'].expression);
      }

      return node;
    },

    serialize(
      node: BooleanNode,
      _context: SerializeContext,
    ): JsonBooleanSchema {
      const result: JsonBooleanSchema = {
        type: 'boolean',
        default: node.defaultValue() ?? false,
      };

      const formula = node.formula();
      if (formula) {
        result.readOnly = true;
        result['x-formula'] = FormulaSerializer.toXFormula(formula);
      }

      return result;
    },

    getDefaultValue(schema: JsonBooleanSchema): boolean {
      return 'default' in schema ? schema.default : false;
    },

    parseDefaultValueString(valueStr: string): boolean | undefined {
      if (!valueStr) {
        return undefined;
      }
      const lower = valueStr.toLowerCase();
      if (lower === 'true') {
        return true;
      }
      if (lower === 'false') {
        return false;
      }
      return undefined;
    },
  };
