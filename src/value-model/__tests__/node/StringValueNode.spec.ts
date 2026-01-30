import { StringValueNode, resetNodeIdCounter } from '../../node';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('StringValueNode', () => {
  describe('construction', () => {
    it('creates node with value', () => {
      const node = new StringValueNode(
        undefined,
        'name',
        { type: 'string' },
        'John',
      );

      expect(node.value).toBe('John');
      expect(node.name).toBe('name');
      expect(node.type).toBe('string');
    });

    it('uses default from schema when no value provided', () => {
      const node = new StringValueNode(undefined, 'name', {
        type: 'string',
        default: 'default value',
      });

      expect(node.value).toBe('default value');
    });

    it('uses empty string when no value and no default', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });

      expect(node.value).toBe('');
    });

    it('uses provided id', () => {
      const node = new StringValueNode('custom-id', 'name', { type: 'string' });

      expect(node.id).toBe('custom-id');
    });

    it('generates id when not provided', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });

      expect(node.id).toBe('node-1');
    });
  });

  describe('setValue', () => {
    it('sets string value', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });

      node.setValue('new value');

      expect(node.value).toBe('new value');
    });

    it('converts null to empty string', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });

      node.setValue(null);

      expect(node.value).toBe('');
    });

    it('converts undefined to empty string', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });
      node.setValue('initial');

      node.setValue(undefined);

      expect(node.value).toBe('');
    });

    it('converts number to string', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });

      node.setValue(42);

      expect(node.value).toBe('42');
    });

    it('converts boolean to string', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });

      node.setValue(true);

      expect(node.value).toBe('true');
    });
  });

  describe('readOnly', () => {
    it('throws when setting value on readOnly field', () => {
      const node = new StringValueNode(undefined, 'name', {
        type: 'string',
        readOnly: true,
      });

      expect(() => node.setValue('new')).toThrow(
        'Cannot set value on read-only field: name',
      );
    });

    it('throws when field has formula', () => {
      const node = new StringValueNode(undefined, 'name', {
        type: 'string',
        'x-formula': { version: 1, expression: 'other' },
      });

      expect(() => node.setValue('new')).toThrow(
        'Cannot set value on read-only field: name',
      );
    });

    it('allows internal setValue on readOnly field', () => {
      const node = new StringValueNode(undefined, 'name', {
        type: 'string',
        readOnly: true,
      });

      node.setValue('new', { internal: true });

      expect(node.value).toBe('new');
    });

    it('isReadOnly returns true for readOnly schema', () => {
      const node = new StringValueNode(undefined, 'name', {
        type: 'string',
        readOnly: true,
      });

      expect(node.isReadOnly).toBe(true);
    });

    it('isReadOnly returns true for formula field', () => {
      const node = new StringValueNode(undefined, 'name', {
        type: 'string',
        'x-formula': { version: 1, expression: 'other' },
      });

      expect(node.isReadOnly).toBe(true);
    });

    it('isReadOnly returns false for normal field', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });

      expect(node.isReadOnly).toBe(false);
    });
  });

  describe('formula', () => {
    it('returns formula definition from schema', () => {
      const node = new StringValueNode(undefined, 'name', {
        type: 'string',
        'x-formula': { version: 1, expression: 'other + "_suffix"' },
      });

      expect(node.formula).toEqual({
        expression: 'other + "_suffix"',
        version: 1,
      });
    });

    it('returns undefined when no formula', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });

      expect(node.formula).toBeUndefined();
    });
  });

  describe('formulaWarning', () => {
    it('returns null by default', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });

      expect(node.formulaWarning).toBeNull();
    });

    it('sets and gets formula warning', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });
      const warning = {
        type: 'type-coercion' as const,
        message: 'Value coerced',
        expression: 'test',
        computedValue: 42,
      };

      node.setFormulaWarning(warning);

      expect(node.formulaWarning).toEqual(warning);
    });

    it('clears formula warning', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });
      node.setFormulaWarning({
        type: 'type-coercion',
        message: 'test',
        expression: 'test',
        computedValue: 42,
      });

      node.setFormulaWarning(null);

      expect(node.formulaWarning).toBeNull();
    });
  });

  describe('validation - required', () => {
    it('returns error when required and empty', () => {
      const node = new StringValueNode(undefined, 'name', {
        type: 'string',
        required: true,
      });

      const errors = node.errors;

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('required');
      expect(errors[0].severity).toBe('error');
    });

    it('returns no error when required and has value', () => {
      const node = new StringValueNode(
        undefined,
        'name',
        {
          type: 'string',
          required: true,
        },
        'John',
      );

      expect(node.errors).toHaveLength(0);
    });

    it('returns no error when not required and empty', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });

      expect(node.errors).toHaveLength(0);
    });
  });

  describe('validation - foreignKey', () => {
    it('returns error when foreignKey and empty', () => {
      const node = new StringValueNode(undefined, 'categoryId', {
        type: 'string',
        foreignKey: 'categories',
      });

      const errors = node.errors;

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('foreignKey');
      expect(errors[0].params).toEqual({ table: 'categories' });
    });

    it('returns no error when foreignKey has value', () => {
      const node = new StringValueNode(
        undefined,
        'categoryId',
        {
          type: 'string',
          foreignKey: 'categories',
        },
        'cat-123',
      );

      expect(node.errors).toHaveLength(0);
    });
  });

  describe('validation - minLength', () => {
    it('returns error when below minLength', () => {
      const node = new StringValueNode(
        undefined,
        'name',
        {
          type: 'string',
          minLength: 5,
        },
        'abc',
      );

      const errors = node.errors;

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('minLength');
      expect(errors[0].params).toEqual({ min: 5, actual: 3 });
    });

    it('skips minLength check for empty string', () => {
      const node = new StringValueNode(undefined, 'name', {
        type: 'string',
        minLength: 5,
      });

      expect(node.errors).toHaveLength(0);
    });

    it('returns no error when meets minLength', () => {
      const node = new StringValueNode(
        undefined,
        'name',
        {
          type: 'string',
          minLength: 3,
        },
        'John',
      );

      expect(node.errors).toHaveLength(0);
    });
  });

  describe('validation - maxLength', () => {
    it('returns error when above maxLength', () => {
      const node = new StringValueNode(
        undefined,
        'name',
        {
          type: 'string',
          maxLength: 3,
        },
        'John',
      );

      const errors = node.errors;

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('maxLength');
      expect(errors[0].params).toEqual({ max: 3, actual: 4 });
    });

    it('returns no error when within maxLength', () => {
      const node = new StringValueNode(
        undefined,
        'name',
        {
          type: 'string',
          maxLength: 10,
        },
        'John',
      );

      expect(node.errors).toHaveLength(0);
    });
  });

  describe('validation - pattern', () => {
    it('returns error when pattern does not match', () => {
      const node = new StringValueNode(
        undefined,
        'email',
        {
          type: 'string',
          pattern: '^[a-z]+@[a-z]+\\.[a-z]+$',
        },
        'invalid',
      );

      const errors = node.errors;

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('pattern');
    });

    it('skips pattern check for empty string', () => {
      const node = new StringValueNode(undefined, 'email', {
        type: 'string',
        pattern: '^[a-z]+@[a-z]+\\.[a-z]+$',
      });

      expect(node.errors).toHaveLength(0);
    });

    it('returns no error when pattern matches', () => {
      const node = new StringValueNode(
        undefined,
        'email',
        {
          type: 'string',
          pattern: '^[a-z]+@[a-z]+\\.[a-z]+$',
        },
        'test@example.com',
      );

      expect(node.errors).toHaveLength(0);
    });
  });

  describe('validation - enum', () => {
    it('returns error when value not in enum', () => {
      const node = new StringValueNode(
        undefined,
        'status',
        {
          type: 'string',
          enum: ['active', 'inactive'],
        },
        'pending',
      );

      const errors = node.errors;

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('enum');
      expect(errors[0].params).toEqual({
        allowed: ['active', 'inactive'],
        actual: 'pending',
      });
    });

    it('returns no error when value in enum', () => {
      const node = new StringValueNode(
        undefined,
        'status',
        {
          type: 'string',
          enum: ['active', 'inactive'],
        },
        'active',
      );

      expect(node.errors).toHaveLength(0);
    });
  });

  describe('warnings', () => {
    it('returns empty when no formula warning', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });

      expect(node.warnings).toHaveLength(0);
    });

    it('returns warning from formula', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });
      node.setFormulaWarning({
        type: 'type-coercion',
        message: 'Value coerced to string',
        expression: 'number',
        computedValue: 42,
      });

      const warnings = node.warnings;

      expect(warnings).toHaveLength(1);
      expect(warnings[0].severity).toBe('warning');
      expect(warnings[0].type).toBe('type-coercion');
    });
  });

  describe('isValid and hasWarnings', () => {
    it('isValid is true when no errors', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });

      expect(node.isValid).toBe(true);
    });

    it('isValid is false when has errors', () => {
      const node = new StringValueNode(undefined, 'name', {
        type: 'string',
        required: true,
      });

      expect(node.isValid).toBe(false);
    });

    it('hasWarnings is false when no warnings', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });

      expect(node.hasWarnings).toBe(false);
    });

    it('hasWarnings is true when has formula warning', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });
      node.setFormulaWarning({
        type: 'type-coercion',
        message: 'test',
        expression: 'test',
        computedValue: 42,
      });

      expect(node.hasWarnings).toBe(true);
    });

    it('isValid is true even with warnings', () => {
      const node = new StringValueNode(
        undefined,
        'name',
        { type: 'string' },
        'value',
      );
      node.setFormulaWarning({
        type: 'type-coercion',
        message: 'test',
        expression: 'test',
        computedValue: 42,
      });

      expect(node.isValid).toBe(true);
      expect(node.hasWarnings).toBe(true);
    });
  });

  describe('getPlainValue', () => {
    it('returns string value', () => {
      const node = new StringValueNode(
        undefined,
        'name',
        { type: 'string' },
        'John',
      );

      expect(node.getPlainValue()).toBe('John');
    });
  });

  describe('isPrimitive', () => {
    it('returns true', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });

      expect(node.isPrimitive()).toBe(true);
    });
  });

  describe('type checks', () => {
    it('isObject returns false', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });

      expect(node.isObject()).toBe(false);
    });

    it('isArray returns false', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });

      expect(node.isArray()).toBe(false);
    });
  });

  describe('dirty tracking', () => {
    it('isDirty is false initially', () => {
      const node = new StringValueNode(
        undefined,
        'name',
        { type: 'string' },
        'John',
      );

      expect(node.isDirty).toBe(false);
    });

    it('isDirty is true after setValue', () => {
      const node = new StringValueNode(
        undefined,
        'name',
        { type: 'string' },
        'John',
      );

      node.setValue('Jane');

      expect(node.isDirty).toBe(true);
    });

    it('isDirty is false when value set back to base', () => {
      const node = new StringValueNode(
        undefined,
        'name',
        { type: 'string' },
        'John',
      );
      node.setValue('Jane');

      node.setValue('John');

      expect(node.isDirty).toBe(false);
    });

    it('baseValue reflects initial value', () => {
      const node = new StringValueNode(
        undefined,
        'name',
        { type: 'string' },
        'John',
      );
      node.setValue('Jane');

      expect(node.baseValue).toBe('John');
      expect(node.value).toBe('Jane');
    });

    it('commit updates baseValue', () => {
      const node = new StringValueNode(
        undefined,
        'name',
        { type: 'string' },
        'John',
      );
      node.setValue('Jane');

      node.commit();

      expect(node.baseValue).toBe('Jane');
      expect(node.value).toBe('Jane');
      expect(node.isDirty).toBe(false);
    });

    it('revert restores value to baseValue', () => {
      const node = new StringValueNode(
        undefined,
        'name',
        { type: 'string' },
        'John',
      );
      node.setValue('Jane');

      node.revert();

      expect(node.value).toBe('John');
      expect(node.isDirty).toBe(false);
    });
  });
});
