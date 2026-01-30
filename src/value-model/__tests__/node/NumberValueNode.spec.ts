import { NumberValueNode, resetNodeIdCounter } from '../../node';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('NumberValueNode', () => {
  describe('construction', () => {
    it('creates node with value', () => {
      const node = new NumberValueNode(
        undefined,
        'age',
        { type: 'number' },
        25,
      );

      expect(node.value).toBe(25);
      expect(node.name).toBe('age');
      expect(node.type).toBe('number');
    });

    it('uses default from schema when no value provided', () => {
      const node = new NumberValueNode(undefined, 'age', {
        type: 'number',
        default: 18,
      });

      expect(node.value).toBe(18);
    });

    it('uses zero when no value and no default', () => {
      const node = new NumberValueNode(undefined, 'age', { type: 'number' });

      expect(node.value).toBe(0);
    });

    it('allows zero as explicit value', () => {
      const node = new NumberValueNode(
        undefined,
        'count',
        { type: 'number' },
        0,
      );

      expect(node.value).toBe(0);
    });

    it('allows negative values', () => {
      const node = new NumberValueNode(
        undefined,
        'temperature',
        { type: 'number' },
        -10,
      );

      expect(node.value).toBe(-10);
    });
  });

  describe('setValue', () => {
    it('sets number value', () => {
      const node = new NumberValueNode(undefined, 'age', { type: 'number' });

      node.setValue(30);

      expect(node.value).toBe(30);
    });

    it('converts string to number', () => {
      const node = new NumberValueNode(undefined, 'age', { type: 'number' });

      node.setValue('42');

      expect(node.value).toBe(42);
    });

    it('converts non-numeric string to zero', () => {
      const node = new NumberValueNode(undefined, 'age', { type: 'number' });

      node.setValue('invalid');

      expect(node.value).toBe(0);
    });

    it('converts null to zero', () => {
      const node = new NumberValueNode(undefined, 'age', { type: 'number' });
      node.setValue(10);

      node.setValue(null);

      expect(node.value).toBe(0);
    });

    it('converts undefined to zero', () => {
      const node = new NumberValueNode(undefined, 'age', { type: 'number' });
      node.setValue(10);

      node.setValue(undefined);

      expect(node.value).toBe(0);
    });

    it('converts boolean to number', () => {
      const node = new NumberValueNode(undefined, 'flag', { type: 'number' });

      node.setValue(true);

      expect(node.value).toBe(1);
    });
  });

  describe('readOnly', () => {
    it('throws when setting value on readOnly field', () => {
      const node = new NumberValueNode(undefined, 'total', {
        type: 'number',
        readOnly: true,
      });

      expect(() => node.setValue(100)).toThrow(
        'Cannot set value on read-only field: total',
      );
    });

    it('throws when field has formula', () => {
      const node = new NumberValueNode(undefined, 'total', {
        type: 'number',
        'x-formula': { version: 1, expression: 'price * quantity' },
      });

      expect(() => node.setValue(100)).toThrow(
        'Cannot set value on read-only field: total',
      );
    });

    it('allows internal setValue on readOnly field', () => {
      const node = new NumberValueNode(undefined, 'total', {
        type: 'number',
        readOnly: true,
      });

      node.setValue(100, { internal: true });

      expect(node.value).toBe(100);
    });
  });

  describe('formula', () => {
    it('returns formula definition from schema', () => {
      const node = new NumberValueNode(undefined, 'total', {
        type: 'number',
        'x-formula': { version: 1, expression: 'price * quantity' },
      });

      expect(node.formula).toEqual({
        expression: 'price * quantity',
        version: 1,
      });
    });

    it('returns undefined when no formula', () => {
      const node = new NumberValueNode(undefined, 'price', { type: 'number' });

      expect(node.formula).toBeUndefined();
    });
  });

  describe('formulaWarning', () => {
    it('returns null by default', () => {
      const node = new NumberValueNode(undefined, 'total', { type: 'number' });

      expect(node.formulaWarning).toBeNull();
    });

    it('sets and gets formula warning for NaN', () => {
      const node = new NumberValueNode(undefined, 'total', { type: 'number' });
      const warning = {
        type: 'nan' as const,
        message: 'Formula resulted in NaN',
        expression: 'a / 0',
        computedValue: NaN,
      };

      node.setFormulaWarning(warning);

      expect(node.formulaWarning).toEqual(warning);
    });

    it('sets and gets formula warning for Infinity', () => {
      const node = new NumberValueNode(undefined, 'total', { type: 'number' });
      const warning = {
        type: 'infinity' as const,
        message: 'Formula resulted in Infinity',
        expression: '1 / 0',
        computedValue: Infinity,
      };

      node.setFormulaWarning(warning);

      expect(node.formulaWarning).toEqual(warning);
    });
  });

  describe('validation - minimum', () => {
    it('returns error when below minimum', () => {
      const node = new NumberValueNode(
        undefined,
        'age',
        {
          type: 'number',
          minimum: 18,
        },
        15,
      );

      const errors = node.errors;

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('min');
      expect(errors[0].message).toBe('Value must be at least 18');
      expect(errors[0].params).toEqual({ min: 18, actual: 15 });
    });

    it('returns no error when equal to minimum', () => {
      const node = new NumberValueNode(
        undefined,
        'age',
        {
          type: 'number',
          minimum: 18,
        },
        18,
      );

      expect(node.errors).toHaveLength(0);
    });

    it('returns no error when above minimum', () => {
      const node = new NumberValueNode(
        undefined,
        'age',
        {
          type: 'number',
          minimum: 18,
        },
        25,
      );

      expect(node.errors).toHaveLength(0);
    });

    it('handles minimum of zero', () => {
      const node = new NumberValueNode(
        undefined,
        'count',
        {
          type: 'number',
          minimum: 0,
        },
        -1,
      );

      expect(node.errors).toHaveLength(1);
      expect(node.errors[0].type).toBe('min');
    });
  });

  describe('validation - maximum', () => {
    it('returns error when above maximum', () => {
      const node = new NumberValueNode(
        undefined,
        'age',
        {
          type: 'number',
          maximum: 100,
        },
        120,
      );

      const errors = node.errors;

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('max');
      expect(errors[0].message).toBe('Value must be at most 100');
      expect(errors[0].params).toEqual({ max: 100, actual: 120 });
    });

    it('returns no error when equal to maximum', () => {
      const node = new NumberValueNode(
        undefined,
        'age',
        {
          type: 'number',
          maximum: 100,
        },
        100,
      );

      expect(node.errors).toHaveLength(0);
    });

    it('returns no error when below maximum', () => {
      const node = new NumberValueNode(
        undefined,
        'age',
        {
          type: 'number',
          maximum: 100,
        },
        50,
      );

      expect(node.errors).toHaveLength(0);
    });
  });

  describe('validation - min and max together', () => {
    it('returns both errors when outside range', () => {
      const node = new NumberValueNode(
        undefined,
        'score',
        {
          type: 'number',
          minimum: 0,
          maximum: 100,
        },
        150,
      );

      expect(node.errors).toHaveLength(1);
      expect(node.errors[0].type).toBe('max');
    });

    it('returns min error when below range', () => {
      const node = new NumberValueNode(
        undefined,
        'score',
        {
          type: 'number',
          minimum: 0,
          maximum: 100,
        },
        -10,
      );

      expect(node.errors).toHaveLength(1);
      expect(node.errors[0].type).toBe('min');
    });

    it('returns no error when in range', () => {
      const node = new NumberValueNode(
        undefined,
        'score',
        {
          type: 'number',
          minimum: 0,
          maximum: 100,
        },
        50,
      );

      expect(node.errors).toHaveLength(0);
    });
  });

  describe('validation - enum', () => {
    it('returns error when value not in enum', () => {
      const node = new NumberValueNode(
        undefined,
        'priority',
        {
          type: 'number',
          enum: [1, 2, 3],
        },
        5,
      );

      const errors = node.errors;

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('enum');
      expect(errors[0].params).toEqual({
        allowed: [1, 2, 3],
        actual: 5,
      });
    });

    it('returns no error when value in enum', () => {
      const node = new NumberValueNode(
        undefined,
        'priority',
        {
          type: 'number',
          enum: [1, 2, 3],
        },
        2,
      );

      expect(node.errors).toHaveLength(0);
    });
  });

  describe('warnings', () => {
    it('returns empty when no formula warning', () => {
      const node = new NumberValueNode(undefined, 'total', { type: 'number' });

      expect(node.warnings).toHaveLength(0);
    });

    it('returns warning from NaN formula result', () => {
      const node = new NumberValueNode(undefined, 'total', { type: 'number' });
      node.setFormulaWarning({
        type: 'nan',
        message: 'Formula resulted in NaN',
        expression: 'invalid / 0',
        computedValue: NaN,
      });

      const warnings = node.warnings;

      expect(warnings).toHaveLength(1);
      expect(warnings[0].severity).toBe('warning');
      expect(warnings[0].type).toBe('nan');
    });

    it('returns warning from Infinity formula result', () => {
      const node = new NumberValueNode(undefined, 'total', { type: 'number' });
      node.setFormulaWarning({
        type: 'infinity',
        message: 'Formula resulted in Infinity',
        expression: '1 / 0',
        computedValue: Infinity,
      });

      const warnings = node.warnings;

      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe('infinity');
    });
  });

  describe('isValid and hasWarnings', () => {
    it('isValid is true when no errors', () => {
      const node = new NumberValueNode(
        undefined,
        'age',
        { type: 'number' },
        25,
      );

      expect(node.isValid).toBe(true);
    });

    it('isValid is false when has errors', () => {
      const node = new NumberValueNode(
        undefined,
        'age',
        {
          type: 'number',
          minimum: 18,
        },
        10,
      );

      expect(node.isValid).toBe(false);
    });

    it('hasWarnings is false when no warnings', () => {
      const node = new NumberValueNode(
        undefined,
        'age',
        { type: 'number' },
        25,
      );

      expect(node.hasWarnings).toBe(false);
    });

    it('hasWarnings is true when has formula warning', () => {
      const node = new NumberValueNode(undefined, 'total', { type: 'number' });
      node.setFormulaWarning({
        type: 'nan',
        message: 'test',
        expression: 'test',
        computedValue: NaN,
      });

      expect(node.hasWarnings).toBe(true);
    });

    it('isValid is true even with warnings', () => {
      const node = new NumberValueNode(
        undefined,
        'total',
        { type: 'number' },
        100,
      );
      node.setFormulaWarning({
        type: 'type-coercion',
        message: 'test',
        expression: 'test',
        computedValue: '100',
      });

      expect(node.isValid).toBe(true);
      expect(node.hasWarnings).toBe(true);
    });
  });

  describe('getPlainValue', () => {
    it('returns number value', () => {
      const node = new NumberValueNode(
        undefined,
        'age',
        { type: 'number' },
        25,
      );

      expect(node.getPlainValue()).toBe(25);
    });
  });

  describe('isPrimitive', () => {
    it('returns true', () => {
      const node = new NumberValueNode(undefined, 'age', { type: 'number' });

      expect(node.isPrimitive()).toBe(true);
    });
  });
});
