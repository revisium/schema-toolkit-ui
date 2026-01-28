import type { SchemaNode } from '../../node/SchemaNode';
import type { NodeMetadata } from '../../node/NodeMetadata';
import type { JsonSchemaType } from '../../schema/JsonSchema';
import type { TypeCapabilities } from './TypeCapabilities';

export interface ParseContext {
  generateId: () => string;
  parseNode: (schema: JsonSchemaType, name: string) => SchemaNode;
  addPendingFormula: (nodeId: string, expression: string) => void;
}

export interface SerializeContext {
  serialize: (node: SchemaNode) => JsonSchemaType;
}

export interface TypeDescriptor<
  TSchema extends JsonSchemaType = JsonSchemaType,
  TNode extends SchemaNode = SchemaNode,
> {
  readonly type: string;

  readonly capabilities: TypeCapabilities;

  canParse(schema: JsonSchemaType): schema is TSchema;

  parse(
    schema: TSchema,
    name: string,
    metadata: NodeMetadata,
    context: ParseContext,
  ): TNode;

  serialize(node: TNode, context: SerializeContext): TSchema;

  getDefaultValue(schema: TSchema): unknown;

  parseDefaultValueString(valueStr: string): unknown;
}
