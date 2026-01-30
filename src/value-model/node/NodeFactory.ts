import type { SchemaDefinition } from '../core/types';
import type { ValueNode } from './types';
import { StringValueNode } from './StringValueNode';
import { NumberValueNode } from './NumberValueNode';
import { BooleanValueNode } from './BooleanValueNode';
import { ObjectValueNode } from './ObjectValueNode';
import { ArrayValueNode } from './ArrayValueNode';

export type NodeFactoryFn = (
  name: string,
  schema: SchemaDefinition,
  value: unknown,
  id?: string,
) => ValueNode;

export class NodeFactoryRegistry {
  private readonly factories = new Map<string, NodeFactoryFn>();

  register(schemaType: string, factory: NodeFactoryFn): this {
    this.factories.set(schemaType, factory);
    return this;
  }

  get(schemaType: string): NodeFactoryFn | undefined {
    return this.factories.get(schemaType);
  }

  has(schemaType: string): boolean {
    return this.factories.has(schemaType);
  }
}

export class NodeFactory {
  constructor(private readonly registry: NodeFactoryRegistry) {}

  create(
    name: string,
    schema: SchemaDefinition,
    value: unknown,
    id?: string,
  ): ValueNode {
    const schemaType = schema.type ?? 'object';
    const factory = this.registry.get(schemaType);

    if (!factory) {
      throw new Error(`Unknown schema type: ${schemaType}`);
    }

    return factory(name, schema, value, id);
  }

  createTree(schema: SchemaDefinition, value: unknown): ValueNode {
    return this.create('', schema, value);
  }
}

const stringFactory: NodeFactoryFn = (name, schema, value, id) => {
  return new StringValueNode(id, name, schema, value as string | undefined);
};

const numberFactory: NodeFactoryFn = (name, schema, value, id) => {
  return new NumberValueNode(id, name, schema, value as number | undefined);
};

const booleanFactory: NodeFactoryFn = (name, schema, value, id) => {
  return new BooleanValueNode(id, name, schema, value as boolean | undefined);
};

function createObjectFactory(nodeFactory: NodeFactory): NodeFactoryFn {
  return (name, schema, value, id) => {
    const objValue = (value ?? {}) as Record<string, unknown>;
    const children: ValueNode[] = [];

    const properties = schema.properties ?? {};
    for (const [propName, propSchema] of Object.entries(properties)) {
      const propValue = objValue[propName];
      const childNode = nodeFactory.create(propName, propSchema, propValue);
      children.push(childNode);
    }

    return new ObjectValueNode(id, name, schema, children);
  };
}

function createArrayFactory(nodeFactory: NodeFactory): NodeFactoryFn {
  return (name, schema, value, id) => {
    const arrValue = (value ?? []) as unknown[];
    const itemSchema = schema.items ?? { type: 'string' };
    const items: ValueNode[] = [];

    for (let i = 0; i < arrValue.length; i++) {
      const itemValue = arrValue[i];
      const itemNode = nodeFactory.create(String(i), itemSchema, itemValue);
      items.push(itemNode);
    }

    return new ArrayValueNode(id, name, schema, items);
  };
}

export function createDefaultRegistry(): NodeFactoryRegistry {
  const registry = new NodeFactoryRegistry();

  registry.register('string', stringFactory);
  registry.register('number', numberFactory);
  registry.register('boolean', booleanFactory);

  return registry;
}

export function createNodeFactory(): NodeFactory {
  const registry = createDefaultRegistry();
  const factory = new NodeFactory(registry);

  registry.register('object', createObjectFactory(factory));
  registry.register('array', createArrayFactory(factory));

  return factory;
}
