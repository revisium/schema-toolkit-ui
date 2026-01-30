import { jest } from '@jest/globals';
import {
  ChangeHandlerRegistry,
  PathPatternRule,
  SchemaTypeRule,
  AnyRule,
} from '../handlers';
import type { ChangeHandlerContext } from '../handlers';
import { StringValueNode, NumberValueNode, resetNodeIdCounter } from '../node';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('ChangeHandlerRegistry', () => {
  describe('registration and lookup', () => {
    it('returns empty array when no handlers registered', () => {
      const registry = new ChangeHandlerRegistry();

      expect(registry.getAll({ type: 'string' })).toEqual([]);
    });

    it('returns handler when rule matches', () => {
      const registry = new ChangeHandlerRegistry();
      const handler = jest.fn();
      registry.register(new SchemaTypeRule('string'), () => handler);

      const handlers = registry.getAll({ type: 'string' });

      expect(handlers).toHaveLength(1);
      expect(handlers[0]).toBe(handler);
    });

    it('returns empty when no rule matches', () => {
      const registry = new ChangeHandlerRegistry();
      registry.register(new SchemaTypeRule('string'), () => jest.fn());

      expect(registry.getAll({ type: 'number' })).toEqual([]);
    });

    it('has returns true when rule matches', () => {
      const registry = new ChangeHandlerRegistry();
      registry.register(new SchemaTypeRule('string'), () => jest.fn());

      expect(registry.has({ type: 'string' })).toBe(true);
      expect(registry.has({ type: 'number' })).toBe(false);
    });

    it('returns multiple handlers when multiple rules match', () => {
      const registry = new ChangeHandlerRegistry();
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      registry.register(new SchemaTypeRule('string'), () => handler1);
      registry.register(new AnyRule(), () => handler2);

      const handlers = registry.getAll({ type: 'string' });

      expect(handlers).toHaveLength(2);
      expect(handlers).toContain(handler1);
      expect(handlers).toContain(handler2);
    });
  });
});

describe('SchemaTypeRule', () => {
  it('matches schema with exact type', () => {
    const rule = new SchemaTypeRule('string');

    expect(rule.matches({ type: 'string' })).toBe(true);
    expect(rule.matches({ type: 'number' })).toBe(false);
    expect(rule.matches({})).toBe(false);
  });
});

describe('AnyRule', () => {
  it('matches any schema', () => {
    const rule = new AnyRule();

    expect(rule.matches({ type: 'string' })).toBe(true);
    expect(rule.matches({ type: 'number' })).toBe(true);
    expect(rule.matches({})).toBe(true);
    expect(rule.matches({ $ref: 'Something' })).toBe(true);
  });
});

describe('PathPatternRule', () => {
  it('matches path with string pattern', () => {
    const rule = new PathPatternRule('^name$');

    expect(rule.matchesPath('name')).toBe(true);
    expect(rule.matchesPath('names')).toBe(false);
    expect(rule.matchesPath('fullname')).toBe(false);
  });

  it('matches path with regex pattern', () => {
    const rule = new PathPatternRule(/items\[\d+\]\.price/);

    expect(rule.matchesPath('items[0].price')).toBe(true);
    expect(rule.matchesPath('items[123].price')).toBe(true);
    expect(rule.matchesPath('items.price')).toBe(false);
  });

  it('matches method always returns true (filtering by path)', () => {
    const rule = new PathPatternRule('^name$');

    // matches() is for schema, always true for PathPatternRule
    expect(rule.matches({ type: 'string' })).toBe(true);
    expect(rule.matches({ type: 'number' })).toBe(true);
  });
});

describe('Integration: handler invocation', () => {
  it('handlers receive correct context', () => {
    const registry = new ChangeHandlerRegistry();
    const receivedContexts: ChangeHandlerContext[] = [];

    registry.register(new SchemaTypeRule('string'), () => (ctx) => {
      receivedContexts.push(ctx);
    });

    const node = new StringValueNode(
      undefined,
      'name',
      { type: 'string' },
      'old',
    );
    const handlers = registry.getAll(node.schema);

    // Simulate calling handler with context
    const context: ChangeHandlerContext = {
      node,
      path: 'name',
      previousValue: 'old',
      newValue: 'new',
    };

    handlers.forEach((handler) => handler(context));

    expect(receivedContexts).toHaveLength(1);
    expect(receivedContexts[0]).toEqual(context);
  });

  it('multiple handlers called in order', () => {
    const registry = new ChangeHandlerRegistry();
    const callOrder: string[] = [];

    registry.register(new AnyRule(), () => () => callOrder.push('first'));
    registry.register(new AnyRule(), () => () => callOrder.push('second'));
    registry.register(new AnyRule(), () => () => callOrder.push('third'));

    const handlers = registry.getAll({ type: 'string' });
    const context: ChangeHandlerContext = {
      node: new StringValueNode(undefined, 'test', { type: 'string' }),
      path: 'test',
      previousValue: '',
      newValue: 'value',
    };

    handlers.forEach((handler) => handler(context));

    expect(callOrder).toEqual(['first', 'second', 'third']);
  });
});

describe('Use case: logging handler', () => {
  it('logs all changes', () => {
    const registry = new ChangeHandlerRegistry();
    const logs: string[] = [];

    registry.register(new AnyRule(), () => (ctx) => {
      logs.push(
        `${ctx.path}: ${String(ctx.previousValue)} -> ${String(ctx.newValue)}`,
      );
    });

    const stringNode = new StringValueNode(
      undefined,
      'name',
      { type: 'string' },
      'old',
    );
    const numberNode = new NumberValueNode(
      undefined,
      'age',
      { type: 'number' },
      25,
    );

    const stringHandlers = registry.getAll(stringNode.schema);
    const numberHandlers = registry.getAll(numberNode.schema);

    stringHandlers.forEach((h) =>
      h({
        node: stringNode,
        path: 'name',
        previousValue: 'old',
        newValue: 'new',
      }),
    );
    numberHandlers.forEach((h) =>
      h({ node: numberNode, path: 'age', previousValue: 25, newValue: 30 }),
    );

    expect(logs).toEqual(['name: old -> new', 'age: 25 -> 30']);
  });
});

describe('Use case: type-specific handlers', () => {
  it('different handlers for different types', () => {
    const registry = new ChangeHandlerRegistry();
    const stringChanges: string[] = [];
    const numberChanges: number[] = [];

    registry.register(new SchemaTypeRule('string'), () => (ctx) => {
      stringChanges.push(ctx.newValue as string);
    });

    registry.register(new SchemaTypeRule('number'), () => (ctx) => {
      numberChanges.push(ctx.newValue as number);
    });

    const stringNode = new StringValueNode(undefined, 'name', {
      type: 'string',
    });
    const numberNode = new NumberValueNode(undefined, 'age', {
      type: 'number',
    });

    registry.getAll(stringNode.schema).forEach((h) =>
      h({
        node: stringNode,
        path: 'name',
        previousValue: '',
        newValue: 'John',
      }),
    );
    registry
      .getAll(numberNode.schema)
      .forEach((h) =>
        h({ node: numberNode, path: 'age', previousValue: 0, newValue: 25 }),
      );

    expect(stringChanges).toEqual(['John']);
    expect(numberChanges).toEqual([25]);
  });
});
