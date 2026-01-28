import type { JsonSchemaType } from './JsonSchema';
import type { SchemaNode } from '../node/SchemaNode';
import type { NodeMetadata } from '../node/NodeMetadata';
import {
  type TypeRegistry,
  type ParseContext,
  defaultRegistry,
} from '../parsing/index';

let idCounter = 0;

function generateId(): string {
  idCounter++;
  return `node-${idCounter}`;
}

export function resetIdCounter(): void {
  idCounter = 0;
}

interface PendingFormula {
  nodeId: string;
  expression: string;
}

export class SchemaParser {
  private pendingFormulas: PendingFormula[] = [];
  private readonly registry: TypeRegistry;

  constructor(registry: TypeRegistry = defaultRegistry) {
    this.registry = registry;
  }

  parse(schema: JsonSchemaType): SchemaNode {
    this.pendingFormulas = [];
    return this.parseNode(schema, '');
  }

  parseWithRootName(schema: JsonSchemaType, name: string): SchemaNode {
    this.pendingFormulas = [];
    return this.parseNode(schema, name);
  }

  getPendingFormulas(): PendingFormula[] {
    return this.pendingFormulas;
  }

  private parseNode(schema: JsonSchemaType, name: string): SchemaNode {
    const metadata = this.extractMetadata(schema);
    const descriptor = this.registry.findDescriptorForSchema(schema);

    if (!descriptor) {
      throw new Error(
        `No type descriptor found for schema: ${JSON.stringify(schema)}`,
      );
    }

    const context: ParseContext = {
      generateId,
      parseNode: (s, n) => this.parseNode(s, n),
      addPendingFormula: (nodeId, expression) => {
        this.pendingFormulas.push({ nodeId, expression });
      },
    };

    return descriptor.parse(schema, name, metadata, context);
  }

  private extractMetadata(schema: JsonSchemaType): NodeMetadata {
    return {
      title: 'title' in schema ? schema.title : undefined,
      description: 'description' in schema ? schema.description : undefined,
      deprecated: 'deprecated' in schema ? schema.deprecated : undefined,
    };
  }
}
