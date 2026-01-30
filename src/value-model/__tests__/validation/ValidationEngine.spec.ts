import {
  ValidatorRegistry,
  ValidatorResolver,
  ValidationEngine,
  createDefaultValidatorRegistry,
  createValidationEngine,
  RequiredValidator,
  ForeignKeyValidator,
  MinLengthValidator,
  MaxLengthValidator,
  PatternValidator,
  EnumValidator,
  MinimumValidator,
  MaximumValidator,
  SchemaPropertyRule,
  SchemaTruthyRule,
  CompositeRule,
} from '../../validation';
import type { ValidationContext } from '../../validation';

describe('ValidatorRegistry', () => {
  it('registers and retrieves validator', () => {
    const registry = new ValidatorRegistry();
    const factory = () => new RequiredValidator();

    registry.register('required', factory);

    const validator = registry.get('required');
    expect(validator).toBeInstanceOf(RequiredValidator);
  });

  it('returns undefined for unknown validator', () => {
    const registry = new ValidatorRegistry();
    expect(registry.get('unknown')).toBeUndefined();
  });

  it('supports chaining', () => {
    const registry = new ValidatorRegistry();

    const result = registry
      .register('a', () => new RequiredValidator())
      .register('b', () => new MinLengthValidator());

    expect(result).toBe(registry);
  });

  it('has returns true for registered type', () => {
    const registry = new ValidatorRegistry();
    registry.register('required', () => new RequiredValidator());

    expect(registry.has('required')).toBe(true);
    expect(registry.has('unknown')).toBe(false);
  });

  it('adds and retrieves rules', () => {
    const registry = new ValidatorRegistry();
    const rule = new SchemaTruthyRule('required', 'required');

    registry.addRule(rule);

    expect(registry.getRules()).toContain(rule);
  });

  it('lists validator types', () => {
    const registry = new ValidatorRegistry();
    registry.register('required', () => new RequiredValidator());
    registry.register('minLength', () => new MinLengthValidator());

    const types = registry.getValidatorTypes();
    expect(types).toContain('required');
    expect(types).toContain('minLength');
  });
});

describe('ValidatorResolver', () => {
  it('resolves validators based on rules', () => {
    const registry = new ValidatorRegistry();
    registry.register('required', () => new RequiredValidator());
    registry.addRule(new SchemaTruthyRule('required', 'required'));

    const resolver = new ValidatorResolver(registry);
    const context: ValidationContext = {
      value: '',
      schema: { type: 'string', required: true },
      nodeName: 'name',
      nodeType: 'string',
    };

    const validators = resolver.resolve(context);
    expect(validators).toHaveLength(1);
    expect(validators[0]).toBeInstanceOf(RequiredValidator);
  });

  it('returns empty array when no rules match', () => {
    const registry = new ValidatorRegistry();
    registry.register('required', () => new RequiredValidator());
    registry.addRule(new SchemaTruthyRule('required', 'required'));

    const resolver = new ValidatorResolver(registry);
    const context: ValidationContext = {
      value: 'test',
      schema: { type: 'string' },
      nodeName: 'name',
      nodeType: 'string',
    };

    const validators = resolver.resolve(context);
    expect(validators).toHaveLength(0);
  });

  it('resolves multiple validators when multiple rules match', () => {
    const registry = new ValidatorRegistry();
    registry.register('required', () => new RequiredValidator());
    registry.register('minLength', () => new MinLengthValidator());
    registry.addRule(new SchemaTruthyRule('required', 'required'));
    registry.addRule(new SchemaPropertyRule('minLength', 'minLength'));

    const resolver = new ValidatorResolver(registry);
    const context: ValidationContext = {
      value: '',
      schema: { type: 'string', required: true, minLength: 3 },
      nodeName: 'name',
      nodeType: 'string',
    };

    const validators = resolver.resolve(context);
    expect(validators).toHaveLength(2);
  });
});

describe('ValidationEngine', () => {
  it('runs validators and collects diagnostics', () => {
    const registry = new ValidatorRegistry();
    registry.register('required', () => new RequiredValidator());
    registry.addRule(new SchemaTruthyRule('required', 'required'));

    const resolver = new ValidatorResolver(registry);
    const engine = new ValidationEngine(resolver);

    const context: ValidationContext = {
      value: '',
      schema: { type: 'string', required: true },
      nodeName: 'name',
      nodeType: 'string',
    };

    const diagnostics = engine.validate(context);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].type).toBe('required');
  });

  it('returns empty array when validation passes', () => {
    const registry = new ValidatorRegistry();
    registry.register('required', () => new RequiredValidator());
    registry.addRule(new SchemaTruthyRule('required', 'required'));

    const resolver = new ValidatorResolver(registry);
    const engine = new ValidationEngine(resolver);

    const context: ValidationContext = {
      value: 'John',
      schema: { type: 'string', required: true },
      nodeName: 'name',
      nodeType: 'string',
    };

    const diagnostics = engine.validate(context);
    expect(diagnostics).toHaveLength(0);
  });
});

describe('createDefaultValidatorRegistry', () => {
  it('registers all built-in validators', () => {
    const registry = createDefaultValidatorRegistry();

    expect(registry.has('required')).toBe(true);
    expect(registry.has('foreignKey')).toBe(true);
    expect(registry.has('minLength')).toBe(true);
    expect(registry.has('maxLength')).toBe(true);
    expect(registry.has('pattern')).toBe(true);
    expect(registry.has('enum')).toBe(true);
    expect(registry.has('min')).toBe(true);
    expect(registry.has('max')).toBe(true);
  });

  it('has rules for all validators', () => {
    const registry = createDefaultValidatorRegistry();
    const rules = registry.getRules();

    expect(rules.length).toBeGreaterThan(0);
  });
});

describe('createValidationEngine', () => {
  it('creates engine with default registry', () => {
    const engine = createValidationEngine();

    const context: ValidationContext = {
      value: '',
      schema: { type: 'string', required: true },
      nodeName: 'name',
      nodeType: 'string',
    };

    const diagnostics = engine.validate(context);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].type).toBe('required');
  });

  it('accepts custom registry', () => {
    const registry = new ValidatorRegistry();
    registry.register('custom', () => ({
      type: 'custom',
      validate: () => ({
        severity: 'error',
        type: 'custom',
        message: 'Custom error',
        path: '',
      }),
    }));
    registry.addRule({
      validatorType: 'custom',
      shouldApply: () => true,
    });

    const engine = createValidationEngine(registry);

    const context: ValidationContext = {
      value: 'test',
      schema: { type: 'string' },
      nodeName: 'field',
      nodeType: 'string',
    };

    const diagnostics = engine.validate(context);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].type).toBe('custom');
  });
});

describe('RequiredValidator', () => {
  const validator = new RequiredValidator();

  it('returns error for empty string', () => {
    const context: ValidationContext = {
      value: '',
      schema: { type: 'string', required: true },
      nodeName: 'name',
      nodeType: 'string',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).not.toBeNull();
    expect(diagnostic!.type).toBe('required');
  });

  it('returns error for null', () => {
    const context: ValidationContext = {
      value: null,
      schema: { type: 'string', required: true },
      nodeName: 'name',
      nodeType: 'string',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).not.toBeNull();
  });

  it('returns error for undefined', () => {
    const context: ValidationContext = {
      value: undefined,
      schema: { type: 'string', required: true },
      nodeName: 'name',
      nodeType: 'string',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).not.toBeNull();
  });

  it('returns null for non-empty value', () => {
    const context: ValidationContext = {
      value: 'John',
      schema: { type: 'string', required: true },
      nodeName: 'name',
      nodeType: 'string',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).toBeNull();
  });
});

describe('ForeignKeyValidator', () => {
  const validator = new ForeignKeyValidator();

  it('returns error when foreignKey is empty', () => {
    const context: ValidationContext = {
      value: '',
      schema: { type: 'string', foreignKey: 'users' },
      nodeName: 'userId',
      nodeType: 'string',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).not.toBeNull();
    expect(diagnostic!.type).toBe('foreignKey');
    expect(diagnostic!.params?.table).toBe('users');
  });

  it('returns null when foreignKey has value', () => {
    const context: ValidationContext = {
      value: 'user-123',
      schema: { type: 'string', foreignKey: 'users' },
      nodeName: 'userId',
      nodeType: 'string',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).toBeNull();
  });

  it('returns null when no foreignKey in schema', () => {
    const context: ValidationContext = {
      value: '',
      schema: { type: 'string' },
      nodeName: 'name',
      nodeType: 'string',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).toBeNull();
  });
});

describe('MinLengthValidator', () => {
  const validator = new MinLengthValidator();

  it('returns error when value is too short', () => {
    const context: ValidationContext = {
      value: 'ab',
      schema: { type: 'string', minLength: 3 },
      nodeName: 'name',
      nodeType: 'string',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).not.toBeNull();
    expect(diagnostic!.type).toBe('minLength');
    expect(diagnostic!.params?.min).toBe(3);
    expect(diagnostic!.params?.actual).toBe(2);
  });

  it('returns null when value meets minLength', () => {
    const context: ValidationContext = {
      value: 'abc',
      schema: { type: 'string', minLength: 3 },
      nodeName: 'name',
      nodeType: 'string',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).toBeNull();
  });

  it('returns null for empty string (empty is valid for minLength)', () => {
    const context: ValidationContext = {
      value: '',
      schema: { type: 'string', minLength: 3 },
      nodeName: 'name',
      nodeType: 'string',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).toBeNull();
  });

  it('returns null when no minLength in schema', () => {
    const context: ValidationContext = {
      value: 'a',
      schema: { type: 'string' },
      nodeName: 'name',
      nodeType: 'string',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).toBeNull();
  });
});

describe('MaxLengthValidator', () => {
  const validator = new MaxLengthValidator();

  it('returns error when value exceeds maxLength', () => {
    const context: ValidationContext = {
      value: 'abcdef',
      schema: { type: 'string', maxLength: 5 },
      nodeName: 'name',
      nodeType: 'string',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).not.toBeNull();
    expect(diagnostic!.type).toBe('maxLength');
    expect(diagnostic!.params?.max).toBe(5);
    expect(diagnostic!.params?.actual).toBe(6);
  });

  it('returns null when value meets maxLength', () => {
    const context: ValidationContext = {
      value: 'abcde',
      schema: { type: 'string', maxLength: 5 },
      nodeName: 'name',
      nodeType: 'string',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).toBeNull();
  });

  it('returns null when no maxLength in schema', () => {
    const context: ValidationContext = {
      value: 'very long string',
      schema: { type: 'string' },
      nodeName: 'name',
      nodeType: 'string',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).toBeNull();
  });
});

describe('PatternValidator', () => {
  const validator = new PatternValidator();

  it('returns error when value does not match pattern', () => {
    const context: ValidationContext = {
      value: 'invalid',
      schema: { type: 'string', pattern: '^[0-9]+$' },
      nodeName: 'code',
      nodeType: 'string',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).not.toBeNull();
    expect(diagnostic!.type).toBe('pattern');
    expect(diagnostic!.params?.pattern).toBe('^[0-9]+$');
  });

  it('returns null when value matches pattern', () => {
    const context: ValidationContext = {
      value: '12345',
      schema: { type: 'string', pattern: '^[0-9]+$' },
      nodeName: 'code',
      nodeType: 'string',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).toBeNull();
  });

  it('returns null for empty string', () => {
    const context: ValidationContext = {
      value: '',
      schema: { type: 'string', pattern: '^[0-9]+$' },
      nodeName: 'code',
      nodeType: 'string',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).toBeNull();
  });

  it('returns null when no pattern in schema', () => {
    const context: ValidationContext = {
      value: 'anything',
      schema: { type: 'string' },
      nodeName: 'name',
      nodeType: 'string',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).toBeNull();
  });
});

describe('EnumValidator', () => {
  const validator = new EnumValidator();

  it('returns error when value not in enum', () => {
    const context: ValidationContext = {
      value: 'invalid',
      schema: { type: 'string', enum: ['a', 'b', 'c'] },
      nodeName: 'status',
      nodeType: 'string',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).not.toBeNull();
    expect(diagnostic!.type).toBe('enum');
    expect(diagnostic!.params?.allowed).toEqual(['a', 'b', 'c']);
    expect(diagnostic!.params?.actual).toBe('invalid');
  });

  it('returns null when value in enum', () => {
    const context: ValidationContext = {
      value: 'b',
      schema: { type: 'string', enum: ['a', 'b', 'c'] },
      nodeName: 'status',
      nodeType: 'string',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).toBeNull();
  });

  it('works with numbers', () => {
    const context: ValidationContext = {
      value: 2,
      schema: { type: 'number', enum: [1, 2, 3] },
      nodeName: 'priority',
      nodeType: 'number',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).toBeNull();
  });

  it('returns null when no enum in schema', () => {
    const context: ValidationContext = {
      value: 'anything',
      schema: { type: 'string' },
      nodeName: 'name',
      nodeType: 'string',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).toBeNull();
  });
});

describe('MinimumValidator', () => {
  const validator = new MinimumValidator();

  it('returns error when value below minimum', () => {
    const context: ValidationContext = {
      value: 5,
      schema: { type: 'number', minimum: 10 },
      nodeName: 'age',
      nodeType: 'number',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).not.toBeNull();
    expect(diagnostic!.type).toBe('min');
    expect(diagnostic!.params?.min).toBe(10);
    expect(diagnostic!.params?.actual).toBe(5);
  });

  it('returns null when value equals minimum', () => {
    const context: ValidationContext = {
      value: 10,
      schema: { type: 'number', minimum: 10 },
      nodeName: 'age',
      nodeType: 'number',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).toBeNull();
  });

  it('returns null when value above minimum', () => {
    const context: ValidationContext = {
      value: 15,
      schema: { type: 'number', minimum: 10 },
      nodeName: 'age',
      nodeType: 'number',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).toBeNull();
  });

  it('returns null when no minimum in schema', () => {
    const context: ValidationContext = {
      value: -100,
      schema: { type: 'number' },
      nodeName: 'age',
      nodeType: 'number',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).toBeNull();
  });
});

describe('MaximumValidator', () => {
  const validator = new MaximumValidator();

  it('returns error when value above maximum', () => {
    const context: ValidationContext = {
      value: 150,
      schema: { type: 'number', maximum: 100 },
      nodeName: 'percentage',
      nodeType: 'number',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).not.toBeNull();
    expect(diagnostic!.type).toBe('max');
    expect(diagnostic!.params?.max).toBe(100);
    expect(diagnostic!.params?.actual).toBe(150);
  });

  it('returns null when value equals maximum', () => {
    const context: ValidationContext = {
      value: 100,
      schema: { type: 'number', maximum: 100 },
      nodeName: 'percentage',
      nodeType: 'number',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).toBeNull();
  });

  it('returns null when value below maximum', () => {
    const context: ValidationContext = {
      value: 50,
      schema: { type: 'number', maximum: 100 },
      nodeName: 'percentage',
      nodeType: 'number',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).toBeNull();
  });

  it('returns null when no maximum in schema', () => {
    const context: ValidationContext = {
      value: 1000000,
      schema: { type: 'number' },
      nodeName: 'count',
      nodeType: 'number',
    };

    const diagnostic = validator.validate(context);
    expect(diagnostic).toBeNull();
  });
});

describe('Rules', () => {
  describe('SchemaPropertyRule', () => {
    it('applies when property exists', () => {
      const rule = new SchemaPropertyRule('minLength', 'minLength');
      const context: ValidationContext = {
        value: 'test',
        schema: { type: 'string', minLength: 3 },
        nodeName: 'name',
        nodeType: 'string',
      };

      expect(rule.shouldApply(context)).toBe(true);
    });

    it('does not apply when property is undefined', () => {
      const rule = new SchemaPropertyRule('minLength', 'minLength');
      const context: ValidationContext = {
        value: 'test',
        schema: { type: 'string' },
        nodeName: 'name',
        nodeType: 'string',
      };

      expect(rule.shouldApply(context)).toBe(false);
    });
  });

  describe('SchemaTruthyRule', () => {
    it('applies when property is true', () => {
      const rule = new SchemaTruthyRule('required', 'required');
      const context: ValidationContext = {
        value: '',
        schema: { type: 'string', required: true },
        nodeName: 'name',
        nodeType: 'string',
      };

      expect(rule.shouldApply(context)).toBe(true);
    });

    it('does not apply when property is false', () => {
      const rule = new SchemaTruthyRule('required', 'required');
      const context: ValidationContext = {
        value: '',
        schema: { type: 'string', required: false },
        nodeName: 'name',
        nodeType: 'string',
      };

      expect(rule.shouldApply(context)).toBe(false);
    });

    it('does not apply when property is undefined', () => {
      const rule = new SchemaTruthyRule('required', 'required');
      const context: ValidationContext = {
        value: '',
        schema: { type: 'string' },
        nodeName: 'name',
        nodeType: 'string',
      };

      expect(rule.shouldApply(context)).toBe(false);
    });
  });

  describe('CompositeRule', () => {
    it('applies when all conditions match', () => {
      const rule = new CompositeRule('minLength', [
        (ctx) => ctx.nodeType === 'string',
        (ctx) => ctx.schema.minLength !== undefined,
      ]);
      const context: ValidationContext = {
        value: 'test',
        schema: { type: 'string', minLength: 3 },
        nodeName: 'name',
        nodeType: 'string',
      };

      expect(rule.shouldApply(context)).toBe(true);
    });

    it('does not apply when any condition fails', () => {
      const rule = new CompositeRule('minLength', [
        (ctx) => ctx.nodeType === 'string',
        (ctx) => ctx.schema.minLength !== undefined,
      ]);
      const context: ValidationContext = {
        value: 123,
        schema: { type: 'number', minLength: 3 },
        nodeName: 'count',
        nodeType: 'number',
      };

      expect(rule.shouldApply(context)).toBe(false);
    });
  });
});

describe('Integration tests', () => {
  it('validates string with multiple constraints', () => {
    const engine = createValidationEngine();

    const context: ValidationContext = {
      value: 'ab',
      schema: { type: 'string', required: true, minLength: 3, maxLength: 10 },
      nodeName: 'username',
      nodeType: 'string',
    };

    const diagnostics = engine.validate(context);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].type).toBe('minLength');
  });

  it('returns multiple errors when multiple validations fail', () => {
    const engine = createValidationEngine();

    const context: ValidationContext = {
      value: '',
      schema: { type: 'string', required: true, foreignKey: 'users' },
      nodeName: 'userId',
      nodeType: 'string',
    };

    const diagnostics = engine.validate(context);
    expect(diagnostics.length).toBeGreaterThanOrEqual(2);
    expect(diagnostics.map((d) => d.type)).toContain('required');
    expect(diagnostics.map((d) => d.type)).toContain('foreignKey');
  });

  it('validates number with min/max', () => {
    const engine = createValidationEngine();

    const context: ValidationContext = {
      value: 150,
      schema: { type: 'number', minimum: 0, maximum: 100 },
      nodeName: 'percentage',
      nodeType: 'number',
    };

    const diagnostics = engine.validate(context);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].type).toBe('max');
  });

  it('validates enum for both string and number', () => {
    const engine = createValidationEngine();

    const stringContext: ValidationContext = {
      value: 'invalid',
      schema: { type: 'string', enum: ['active', 'inactive'] },
      nodeName: 'status',
      nodeType: 'string',
    };

    const numberContext: ValidationContext = {
      value: 5,
      schema: { type: 'number', enum: [1, 2, 3] },
      nodeName: 'priority',
      nodeType: 'number',
    };

    expect(engine.validate(stringContext)).toHaveLength(1);
    expect(engine.validate(numberContext)).toHaveLength(1);
  });
});
