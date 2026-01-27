import type { SchemaNode } from '../node/SchemaNode';
import type { JsonSchemaType } from './JsonSchema';
import type { TypeRegistry } from '../registry/TypeRegistry';
import type { SerializeContext } from '../registry/TypeDescriptor';
import { defaultRegistry } from '../types/index';

export class SchemaSerializer {
  private readonly registry: TypeRegistry;

  constructor(registry: TypeRegistry = defaultRegistry) {
    this.registry = registry;
  }

  serialize(node: SchemaNode): JsonSchemaType {
    if (node.isNull()) {
      throw new Error('Cannot serialize null node');
    }

    const descriptor = this.registry.getDescriptor(node.nodeType());

    if (!descriptor) {
      throw new Error(
        `No type descriptor found for node type: ${node.nodeType()}`,
      );
    }

    const context: SerializeContext = {
      serialize: (n) => this.serialize(n),
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
