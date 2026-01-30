import type { SchemaDefinition } from '../core/types';
import type { DefaultValueGeneratorFn, DefaultValueRule } from './types';

interface RegisteredGenerator {
  rule: DefaultValueRule;
  generator: DefaultValueGeneratorFn;
}

export class DefaultValueRegistry {
  private readonly generators: RegisteredGenerator[] = [];

  register(rule: DefaultValueRule, generator: DefaultValueGeneratorFn): this {
    this.generators.push({ rule, generator });
    return this;
  }

  get(schema: SchemaDefinition): unknown {
    if ('default' in schema) {
      return schema.default;
    }

    for (const { rule, generator } of this.generators) {
      if (rule.matches(schema)) {
        return generator(schema);
      }
    }

    return undefined;
  }

  has(schema: SchemaDefinition): boolean {
    if ('default' in schema) {
      return true;
    }
    return this.generators.some(({ rule }) => rule.matches(schema));
  }
}
