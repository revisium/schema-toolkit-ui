import {
  DefaultValueRegistry,
  SchemaTypeDefaultRule,
  SchemaRefDefaultRule,
  stringDefaultGenerator,
  numberDefaultGenerator,
  booleanDefaultGenerator,
  arrayDefaultGenerator,
  objectDefaultGenerator,
  uuidDefaultGenerator,
  timestampDefaultGenerator,
  fileDefaultGenerator,
} from '../defaults';

describe('DefaultValueRegistry', () => {
  describe('registration and lookup', () => {
    it('returns undefined when no generators registered and no default in schema', () => {
      const registry = new DefaultValueRegistry();

      expect(registry.get({ type: 'string' })).toBeUndefined();
    });

    it('returns schema default when present', () => {
      const registry = new DefaultValueRegistry();

      expect(registry.get({ type: 'string', default: 'hello' })).toBe('hello');
    });

    it('schema default takes priority over generator', () => {
      const registry = new DefaultValueRegistry();
      registry.register(new SchemaTypeDefaultRule('string'), () => 'generated');

      expect(registry.get({ type: 'string', default: 'explicit' })).toBe(
        'explicit',
      );
    });

    it('returns generated value when rule matches', () => {
      const registry = new DefaultValueRegistry();
      registry.register(
        new SchemaTypeDefaultRule('string'),
        stringDefaultGenerator,
      );

      expect(registry.get({ type: 'string' })).toBe('');
    });

    it('has returns true for schema with default', () => {
      const registry = new DefaultValueRegistry();

      expect(registry.has({ type: 'string', default: 'test' })).toBe(true);
    });

    it('has returns true when rule matches', () => {
      const registry = new DefaultValueRegistry();
      registry.register(
        new SchemaTypeDefaultRule('string'),
        stringDefaultGenerator,
      );

      expect(registry.has({ type: 'string' })).toBe(true);
      expect(registry.has({ type: 'number' })).toBe(false);
    });

    it('first matching rule wins', () => {
      const registry = new DefaultValueRegistry();
      registry.register(new SchemaTypeDefaultRule('string'), () => 'first');
      registry.register(new SchemaTypeDefaultRule('string'), () => 'second');

      expect(registry.get({ type: 'string' })).toBe('first');
    });
  });
});

describe('SchemaTypeDefaultRule', () => {
  it('matches schema with exact type', () => {
    const rule = new SchemaTypeDefaultRule('string');

    expect(rule.matches({ type: 'string' })).toBe(true);
    expect(rule.matches({ type: 'number' })).toBe(false);
    expect(rule.matches({})).toBe(false);
  });
});

describe('SchemaRefDefaultRule', () => {
  it('matches schema with exact $ref', () => {
    const rule = new SchemaRefDefaultRule('File');

    expect(rule.matches({ $ref: 'File' })).toBe(true);
    expect(rule.matches({ $ref: 'Other' })).toBe(false);
    expect(rule.matches({ type: 'object' })).toBe(false);
  });
});

describe('Built-in generators', () => {
  it('stringDefaultGenerator returns empty string', () => {
    expect(stringDefaultGenerator({ type: 'string' })).toBe('');
  });

  it('numberDefaultGenerator returns zero', () => {
    expect(numberDefaultGenerator({ type: 'number' })).toBe(0);
  });

  it('booleanDefaultGenerator returns false', () => {
    expect(booleanDefaultGenerator({ type: 'boolean' })).toBe(false);
  });

  it('arrayDefaultGenerator returns empty array', () => {
    const result = arrayDefaultGenerator({ type: 'array' });
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('objectDefaultGenerator returns empty object', () => {
    const result = objectDefaultGenerator({ type: 'object' });
    expect(result).toEqual({});
  });

  it('uuidDefaultGenerator returns valid UUID v4', () => {
    const uuid = uuidDefaultGenerator({
      type: 'string',
      format: 'uuid',
    }) as string;

    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('uuidDefaultGenerator returns unique values', () => {
    const uuid1 = uuidDefaultGenerator({ type: 'string' });
    const uuid2 = uuidDefaultGenerator({ type: 'string' });

    expect(uuid1).not.toBe(uuid2);
  });

  it('timestampDefaultGenerator returns ISO timestamp', () => {
    const timestamp = timestampDefaultGenerator({
      type: 'string',
      format: 'date-time',
    }) as string;

    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('fileDefaultGenerator returns file reference object', () => {
    const file = fileDefaultGenerator({ $ref: 'File' });

    expect(file).toEqual({
      fileId: '',
      url: '',
      status: 'ready',
    });
  });
});

describe('Integration: full registry setup', () => {
  function createDefaultRegistry(): DefaultValueRegistry {
    const registry = new DefaultValueRegistry();

    registry.register(
      new SchemaTypeDefaultRule('string'),
      stringDefaultGenerator,
    );
    registry.register(
      new SchemaTypeDefaultRule('number'),
      numberDefaultGenerator,
    );
    registry.register(
      new SchemaTypeDefaultRule('boolean'),
      booleanDefaultGenerator,
    );
    registry.register(
      new SchemaTypeDefaultRule('array'),
      arrayDefaultGenerator,
    );
    registry.register(
      new SchemaTypeDefaultRule('object'),
      objectDefaultGenerator,
    );
    registry.register(new SchemaRefDefaultRule('File'), fileDefaultGenerator);

    return registry;
  }

  it('handles all basic types', () => {
    const registry = createDefaultRegistry();

    expect(registry.get({ type: 'string' })).toBe('');
    expect(registry.get({ type: 'number' })).toBe(0);
    expect(registry.get({ type: 'boolean' })).toBe(false);
    expect(registry.get({ type: 'array' })).toEqual([]);
    expect(registry.get({ type: 'object' })).toEqual({});
  });

  it('handles custom refs', () => {
    const registry = createDefaultRegistry();

    expect(registry.get({ $ref: 'File' })).toEqual({
      fileId: '',
      url: '',
      status: 'ready',
    });
  });

  it('explicit defaults override generators', () => {
    const registry = createDefaultRegistry();

    expect(registry.get({ type: 'string', default: 'custom' })).toBe('custom');
    expect(registry.get({ type: 'number', default: 42 })).toBe(42);
    expect(registry.get({ type: 'array', default: [1, 2, 3] })).toEqual([
      1, 2, 3,
    ]);
  });
});
