import type { SchemaDefinition } from '../core/types';
import type { Serializer, SerializerFactoryFn, SerializerRule } from './types';

interface RegisteredSerializer {
  rule: SerializerRule;
  factory: SerializerFactoryFn;
}

export class SerializerRegistry {
  private readonly serializers: RegisteredSerializer[] = [];

  register(rule: SerializerRule, factory: SerializerFactoryFn): this {
    this.serializers.push({ rule, factory });
    return this;
  }

  get(schema: SchemaDefinition): Serializer | undefined {
    for (const { rule, factory } of this.serializers) {
      if (rule.matches(schema)) {
        return factory(schema);
      }
    }
    return undefined;
  }

  has(schema: SchemaDefinition): boolean {
    return this.serializers.some(({ rule }) => rule.matches(schema));
  }
}
