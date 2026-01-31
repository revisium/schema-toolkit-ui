import type { SchemaNode } from '../node/SchemaNode';
import type { NodeTree } from '../tree/NodeTree';
import type { JsonSchemaType, JsonObjectSchema } from './JsonSchema';
import {
  type TypeRegistry,
  type SerializeContext,
  defaultRegistry,
} from '../parsing/index';
import { FormulaSerializer } from '../formula';

export interface SerializeOptions {
  excludeNodeIds?: Set<string>;
}

export class SchemaSerializer {
  private readonly registry: TypeRegistry;
  private tree: NodeTree | null = null;
  private excludeNodeIds: Set<string> = new Set();

  constructor(registry: TypeRegistry = defaultRegistry) {
    this.registry = registry;
  }

  serializeWithTree(
    node: SchemaNode,
    tree: NodeTree,
    options?: SerializeOptions,
  ): JsonSchemaType {
    this.tree = tree;
    this.excludeNodeIds = options?.excludeNodeIds ?? new Set();
    try {
      return this.serialize(node);
    } finally {
      this.tree = null;
      this.excludeNodeIds = new Set();
    }
  }

  serialize(node: SchemaNode): JsonSchemaType {
    if (node.isNull()) {
      throw new Error('Cannot serialize null node');
    }

    if (this.excludeNodeIds.size > 0 && node.isObject()) {
      return this.serializeObjectWithExclusions(node);
    }

    const descriptor = this.registry.getDescriptor(node.nodeType());

    if (!descriptor) {
      throw new Error(
        `No type descriptor found for node type: ${node.nodeType()}`,
      );
    }

    const context: SerializeContext = {
      serialize: (n) => this.serialize(n),
      serializeFormula: (nodeId, formula) => {
        if (!this.tree) {
          throw new Error(
            'Cannot serialize formula without tree context. Use serializeWithTree.',
          );
        }
        return FormulaSerializer.toXFormula(this.tree, nodeId, formula);
      },
    };

    const result = descriptor.serialize(node, context);
    return this.addMetadata(result, node);
  }

  private serializeObjectWithExclusions(node: SchemaNode): JsonObjectSchema {
    const properties: Record<string, JsonSchemaType> = {};
    const required: string[] = [];

    for (const child of node.properties()) {
      if (this.excludeNodeIds.has(child.id())) {
        continue;
      }
      properties[child.name()] = this.serialize(child);
      required.push(child.name());
    }

    const result: JsonObjectSchema = {
      type: 'object',
      properties,
      additionalProperties: false,
      required,
    };

    return this.addMetadata(result, node);
  }

  private addMetadata<
    T extends { title?: string; description?: string; deprecated?: boolean },
  >(schema: T, node: SchemaNode): T {
    const meta = node.metadata();

    if (meta.title) {
      schema.title = meta.title;
    }
    if (meta.description) {
      schema.description = meta.description;
    }
    if (meta.deprecated) {
      schema.deprecated = meta.deprecated;
    }

    return schema;
  }
}
