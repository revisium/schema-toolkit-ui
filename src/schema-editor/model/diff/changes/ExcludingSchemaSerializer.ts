import type { SchemaNode } from '../../node/SchemaNode';
import type { NodeTree } from '../../tree/NodeTree';
import type { JsonSchemaType, JsonObjectSchema } from '../../schema/JsonSchema';
import {
  type TypeRegistry,
  type SerializeContext,
  defaultRegistry,
} from '../../parsing/index';
import { FormulaSerializer } from '../../formula';

export class ExcludingSchemaSerializer {
  private readonly registry: TypeRegistry;
  private tree: NodeTree | null = null;

  constructor(
    private readonly excludeNodeIds: Set<string>,
    registry: TypeRegistry = defaultRegistry,
  ) {
    this.registry = registry;
  }

  serializeWithTree(node: SchemaNode, tree: NodeTree): JsonSchemaType {
    this.tree = tree;
    try {
      return this.serialize(node);
    } finally {
      this.tree = null;
    }
  }

  private serialize(node: SchemaNode): JsonSchemaType {
    if (node.isNull()) {
      throw new Error('Cannot serialize null node');
    }

    if (node.isObject()) {
      return this.serializeObject(node);
    }

    if (node.isArray()) {
      return this.serializeArray(node);
    }

    return this.serializePrimitive(node);
  }

  private serializeObject(node: SchemaNode): JsonObjectSchema {
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

  private serializeArray(node: SchemaNode): JsonSchemaType {
    const items = node.items();

    if (items.isNull()) {
      throw new Error('Array must have items');
    }

    const result: JsonSchemaType = {
      type: 'array',
      items: this.serialize(items),
    };

    return this.addMetadata(result, node);
  }

  private serializePrimitive(node: SchemaNode): JsonSchemaType {
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
