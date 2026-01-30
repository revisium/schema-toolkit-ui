import { StringValueNode } from '../../node/StringValueNode';
import { NumberValueNode } from '../../node/NumberValueNode';
import { BooleanValueNode } from '../../node/BooleanValueNode';
import { resetNodeIdCounter } from '../../node';
import type { SchemaDefinition } from '../../core';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('BasePrimitiveValueNode - common behavior', () => {
  describe('isDirty', () => {
    it('returns false when value equals base value', () => {
      const node = new StringValueNode(undefined, 'field', {
        type: 'string',
        default: 'initial',
      });
      expect(node.isDirty).toBe(false);
    });

    it('returns true when value differs from base value', () => {
      const node = new StringValueNode(
        undefined,
        'field',
        { type: 'string' },
        'initial',
      );
      node.setValue('changed');
      expect(node.isDirty).toBe(true);
    });
  });

  describe('commit', () => {
    it('sets base value to current value', () => {
      const node = new NumberValueNode(
        undefined,
        'field',
        { type: 'number' },
        10,
      );
      node.setValue(20);
      expect(node.isDirty).toBe(true);

      node.commit();

      expect(node.isDirty).toBe(false);
      expect(node.baseValue).toBe(20);
    });
  });

  describe('revert', () => {
    it('restores value to base value', () => {
      const node = new BooleanValueNode(
        undefined,
        'field',
        { type: 'boolean' },
        true,
      );
      node.setValue(false);
      expect(node.value).toBe(false);

      node.revert();

      expect(node.value).toBe(true);
      expect(node.isDirty).toBe(false);
    });
  });

  describe('formula', () => {
    it('returns undefined when no x-formula in schema', () => {
      const node = new NumberValueNode(undefined, 'field', { type: 'number' });
      expect(node.formula).toBeUndefined();
    });

    it('returns formula definition when x-formula exists', () => {
      const schema: SchemaDefinition = {
        type: 'number',
        default: 0,
        'x-formula': { version: 1, expression: 'a + b' },
      };
      const node = new NumberValueNode(undefined, 'field', schema);

      expect(node.formula).toEqual({
        version: 1,
        expression: 'a + b',
      });
    });
  });

  describe('isReadOnly', () => {
    it('returns false by default', () => {
      const node = new StringValueNode(undefined, 'field', { type: 'string' });
      expect(node.isReadOnly).toBe(false);
    });

    it('returns true when schema.readOnly is true', () => {
      const node = new StringValueNode(undefined, 'field', {
        type: 'string',
        readOnly: true,
      });
      expect(node.isReadOnly).toBe(true);
    });

    it('returns true when formula exists', () => {
      const schema: SchemaDefinition = {
        type: 'number',
        'x-formula': { version: 1, expression: 'x * 2' },
      };
      const node = new NumberValueNode(undefined, 'field', schema);
      expect(node.isReadOnly).toBe(true);
    });
  });

  describe('setValue with readOnly', () => {
    it('throws error when setting value on readOnly field', () => {
      const node = new StringValueNode(undefined, 'field', {
        type: 'string',
        readOnly: true,
      });

      expect(() => node.setValue('new')).toThrow(
        'Cannot set value on read-only field: field',
      );
    });

    it('allows internal setValue on readOnly field', () => {
      const node = new NumberValueNode(undefined, 'field', {
        type: 'number',
        readOnly: true,
      });

      node.setValue(100, { internal: true });

      expect(node.value).toBe(100);
    });
  });

  describe('formulaWarning', () => {
    it('returns null by default', () => {
      const node = new NumberValueNode(undefined, 'field', { type: 'number' });
      expect(node.formulaWarning).toBeNull();
    });

    it('returns warning after setFormulaWarning', () => {
      const node = new NumberValueNode(undefined, 'field', { type: 'number' });
      const warning = {
        type: 'nan' as const,
        message: 'Result is NaN',
        expression: '0/0',
        computedValue: NaN,
      };

      node.setFormulaWarning(warning);

      expect(node.formulaWarning).toEqual(warning);
    });

    it('clears warning when set to null', () => {
      const node = new NumberValueNode(undefined, 'field', { type: 'number' });
      node.setFormulaWarning({
        type: 'nan',
        message: 'NaN',
        expression: 'x',
        computedValue: NaN,
      });

      node.setFormulaWarning(null);

      expect(node.formulaWarning).toBeNull();
    });
  });

  describe('warnings', () => {
    it('returns empty array when no formula warning', () => {
      const node = new StringValueNode(undefined, 'field', { type: 'string' });
      expect(node.warnings).toEqual([]);
    });

    it('returns diagnostic when formula warning exists', () => {
      const node = new NumberValueNode(undefined, 'field', { type: 'number' });
      node.setFormulaWarning({
        type: 'infinity',
        message: 'Result is Infinity',
        expression: '1/0',
        computedValue: Infinity,
      });

      const warnings = node.warnings;

      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toEqual({
        severity: 'warning',
        type: 'infinity',
        message: 'Result is Infinity',
        path: 'field',
        params: {
          expression: '1/0',
          computedValue: Infinity,
        },
      });
    });
  });

  describe('isPrimitive', () => {
    it('returns true for all primitive nodes', () => {
      expect(
        new StringValueNode(undefined, 'f', { type: 'string' }).isPrimitive(),
      ).toBe(true);
      expect(
        new NumberValueNode(undefined, 'f', { type: 'number' }).isPrimitive(),
      ).toBe(true);
      expect(
        new BooleanValueNode(undefined, 'f', { type: 'boolean' }).isPrimitive(),
      ).toBe(true);
    });
  });

  describe('getPlainValue', () => {
    it('returns current value for string', () => {
      const node = new StringValueNode(
        undefined,
        'f',
        { type: 'string' },
        'hello',
      );
      expect(node.getPlainValue()).toBe('hello');
    });

    it('returns current value for number', () => {
      const node = new NumberValueNode(undefined, 'f', { type: 'number' }, 42);
      expect(node.getPlainValue()).toBe(42);
    });

    it('returns current value for boolean', () => {
      const node = new BooleanValueNode(
        undefined,
        'f',
        { type: 'boolean' },
        true,
      );
      expect(node.getPlainValue()).toBe(true);
    });
  });
});
