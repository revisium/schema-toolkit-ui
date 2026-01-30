import type { SchemaDefinition } from '../core/types';
import type {
  ChangeHandlerFn,
  ChangeHandlerFactoryFn,
  ChangeHandlerRule,
} from './types';

interface RegisteredHandler {
  rule: ChangeHandlerRule;
  factory: ChangeHandlerFactoryFn;
}

export class ChangeHandlerRegistry {
  private readonly handlers: RegisteredHandler[] = [];

  register(rule: ChangeHandlerRule, factory: ChangeHandlerFactoryFn): this {
    this.handlers.push({ rule, factory });
    return this;
  }

  getAll(schema: SchemaDefinition): ChangeHandlerFn[] {
    const result: ChangeHandlerFn[] = [];

    for (const { rule, factory } of this.handlers) {
      if (rule.matches(schema)) {
        result.push(factory(schema));
      }
    }

    return result;
  }

  has(schema: SchemaDefinition): boolean {
    return this.handlers.some(({ rule }) => rule.matches(schema));
  }
}
