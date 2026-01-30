import { BooleanValueNode } from '../../node/BooleanValueNode';
import { resetNodeIdCounter } from '../../node';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('BooleanValueNode', () => {
  describe('constructor', () => {
    it('initializes with provided value', () => {
      const node = new BooleanValueNode(
        undefined,
        'active',
        { type: 'boolean' },
        true,
      );

      expect(node.value).toBe(true);
      expect(node.baseValue).toBe(true);
    });

    it('initializes with schema default when no value provided', () => {
      const node = new BooleanValueNode(undefined, 'active', {
        type: 'boolean',
        default: true,
      });

      expect(node.value).toBe(true);
    });

    it('initializes with false when no value and no default', () => {
      const node = new BooleanValueNode(undefined, 'active', {
        type: 'boolean',
      });

      expect(node.value).toBe(false);
    });
  });

  describe('type', () => {
    it('returns boolean type', () => {
      const node = new BooleanValueNode(undefined, 'active', {
        type: 'boolean',
      });
      expect(node.type).toBe('boolean');
    });
  });

  describe('defaultValue', () => {
    it('returns schema default when defined', () => {
      const node = new BooleanValueNode(undefined, 'active', {
        type: 'boolean',
        default: true,
      });
      expect(node.defaultValue).toBe(true);
    });

    it('returns false when no schema default', () => {
      const node = new BooleanValueNode(undefined, 'active', {
        type: 'boolean',
      });
      expect(node.defaultValue).toBe(false);
    });
  });

  describe('setValue', () => {
    it('sets boolean value directly', () => {
      const node = new BooleanValueNode(undefined, 'active', {
        type: 'boolean',
      });

      node.setValue(true);

      expect(node.value).toBe(true);
    });

    it('coerces truthy values to true', () => {
      const node = new BooleanValueNode(undefined, 'active', {
        type: 'boolean',
      });

      node.setValue(1);
      expect(node.value).toBe(true);

      node.setValue('yes');
      expect(node.value).toBe(true);

      node.setValue({});
      expect(node.value).toBe(true);
    });

    it('coerces falsy values to false', () => {
      const node = new BooleanValueNode(
        undefined,
        'active',
        { type: 'boolean' },
        true,
      );

      node.setValue(0);
      expect(node.value).toBe(false);

      node.setValue(true);
      node.setValue('');
      expect(node.value).toBe(false);

      node.setValue(true);
      node.setValue(null);
      expect(node.value).toBe(false);

      node.setValue(true);
      node.setValue(undefined);
      expect(node.value).toBe(false);
    });
  });

  describe('value setter', () => {
    it('sets value directly via property', () => {
      const node = new BooleanValueNode(undefined, 'active', {
        type: 'boolean',
      });

      node.value = true;

      expect(node.value).toBe(true);
    });
  });

  describe('dirty tracking', () => {
    it('is not dirty after construction', () => {
      const node = new BooleanValueNode(
        undefined,
        'active',
        { type: 'boolean' },
        true,
      );
      expect(node.isDirty).toBe(false);
    });

    it('becomes dirty after value change', () => {
      const node = new BooleanValueNode(
        undefined,
        'active',
        { type: 'boolean' },
        true,
      );

      node.setValue(false);

      expect(node.isDirty).toBe(true);
    });

    it('is not dirty after commit', () => {
      const node = new BooleanValueNode(
        undefined,
        'active',
        { type: 'boolean' },
        true,
      );
      node.setValue(false);

      node.commit();

      expect(node.isDirty).toBe(false);
      expect(node.baseValue).toBe(false);
    });

    it('is not dirty after revert', () => {
      const node = new BooleanValueNode(
        undefined,
        'active',
        { type: 'boolean' },
        true,
      );
      node.setValue(false);

      node.revert();

      expect(node.isDirty).toBe(false);
      expect(node.value).toBe(true);
    });
  });

  describe('formula support', () => {
    it('returns formula from schema', () => {
      const node = new BooleanValueNode(undefined, 'computed', {
        type: 'boolean',
        'x-formula': { version: 1, expression: 'a && b' },
      });

      expect(node.formula).toEqual({
        version: 1,
        expression: 'a && b',
      });
    });

    it('is readOnly when formula exists', () => {
      const node = new BooleanValueNode(undefined, 'computed', {
        type: 'boolean',
        'x-formula': { version: 1, expression: 'x > 0' },
      });

      expect(node.isReadOnly).toBe(true);
    });

    it('allows internal setValue when readOnly', () => {
      const node = new BooleanValueNode(undefined, 'computed', {
        type: 'boolean',
        readOnly: true,
      });

      node.setValue(true, { internal: true });

      expect(node.value).toBe(true);
    });

    it('throws on external setValue when readOnly', () => {
      const node = new BooleanValueNode(undefined, 'computed', {
        type: 'boolean',
        readOnly: true,
      });

      expect(() => node.setValue(true)).toThrow(
        'Cannot set value on read-only field: computed',
      );
    });
  });

  describe('formula warning', () => {
    it('can set and get formula warning', () => {
      const node = new BooleanValueNode(undefined, 'field', {
        type: 'boolean',
      });
      const warning = {
        type: 'type-coercion' as const,
        message: 'Type coerced',
        expression: 'x',
        computedValue: true,
      };

      node.setFormulaWarning(warning);

      expect(node.formulaWarning).toEqual(warning);
    });

    it('includes formula warning in warnings', () => {
      const node = new BooleanValueNode(undefined, 'field', {
        type: 'boolean',
      });
      node.setFormulaWarning({
        type: 'type-coercion',
        message: 'Coerced to boolean',
        expression: 'x',
        computedValue: true,
      });

      const warnings = node.warnings;

      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe('type-coercion');
    });
  });

  describe('errors', () => {
    it('returns empty errors array (no validation for boolean)', () => {
      const node = new BooleanValueNode(undefined, 'field', {
        type: 'boolean',
      });
      expect(node.errors).toEqual([]);
    });
  });

  describe('isPrimitive', () => {
    it('returns true', () => {
      const node = new BooleanValueNode(undefined, 'field', {
        type: 'boolean',
      });
      expect(node.isPrimitive()).toBe(true);
    });
  });

  describe('getPlainValue', () => {
    it('returns current boolean value', () => {
      const node = new BooleanValueNode(
        undefined,
        'field',
        { type: 'boolean' },
        true,
      );
      expect(node.getPlainValue()).toBe(true);

      node.setValue(false);
      expect(node.getPlainValue()).toBe(false);
    });
  });
});
