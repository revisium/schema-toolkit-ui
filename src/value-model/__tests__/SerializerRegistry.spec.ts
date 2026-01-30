import {
  SerializerRegistry,
  SchemaRefRule,
  SchemaFormatRule,
  DateSerializer,
  FileSerializer,
} from '../serialization';
import {
  StringValueNode,
  NumberValueNode,
  ObjectValueNode,
  resetNodeIdCounter,
} from '../node';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('SerializerRegistry', () => {
  describe('registration and lookup', () => {
    it('returns undefined when no serializers registered', () => {
      const registry = new SerializerRegistry();

      expect(registry.get({ type: 'string' })).toBeUndefined();
    });

    it('returns serializer when rule matches', () => {
      const registry = new SerializerRegistry();
      const rule = new SchemaRefRule('File');
      registry.register(rule, () => new FileSerializer());

      const serializer = registry.get({ $ref: 'File' });

      expect(serializer).toBeInstanceOf(FileSerializer);
    });

    it('returns undefined when no rule matches', () => {
      const registry = new SerializerRegistry();
      const rule = new SchemaRefRule('File');
      registry.register(rule, () => new FileSerializer());

      expect(registry.get({ type: 'string' })).toBeUndefined();
    });

    it('has returns true when rule matches', () => {
      const registry = new SerializerRegistry();
      registry.register(new SchemaRefRule('File'), () => new FileSerializer());

      expect(registry.has({ $ref: 'File' })).toBe(true);
      expect(registry.has({ type: 'string' })).toBe(false);
    });

    it('first matching rule wins', () => {
      const registry = new SerializerRegistry();
      const dateSerializer = new DateSerializer();
      const fileSerializer = new FileSerializer();

      registry.register(new SchemaFormatRule('date'), () => dateSerializer);
      registry.register(new SchemaFormatRule('date'), () => fileSerializer);

      expect(registry.get({ format: 'date' })).toBe(dateSerializer);
    });
  });
});

describe('SchemaRefRule', () => {
  it('matches schema with exact $ref', () => {
    const rule = new SchemaRefRule('File');

    expect(rule.matches({ $ref: 'File' })).toBe(true);
    expect(rule.matches({ $ref: 'Other' })).toBe(false);
    expect(rule.matches({ type: 'string' })).toBe(false);
  });
});

describe('SchemaFormatRule', () => {
  it('matches schema with exact format', () => {
    const rule = new SchemaFormatRule('date-time');

    expect(rule.matches({ type: 'string', format: 'date-time' })).toBe(true);
    expect(rule.matches({ type: 'string', format: 'date' })).toBe(false);
    expect(rule.matches({ type: 'string' })).toBe(false);
  });
});

describe('DateSerializer', () => {
  it('serializes string date as-is', () => {
    const serializer = new DateSerializer();
    const node = new StringValueNode(
      undefined,
      'date',
      { type: 'string' },
      '2024-01-15T10:30:00Z',
    );

    expect(serializer.serialize(node)).toBe('2024-01-15T10:30:00Z');
  });

  it('serializes number timestamp to ISO string', () => {
    const serializer = new DateSerializer();
    const timestamp = new Date('2024-01-15T10:30:00Z').getTime();
    const node = new NumberValueNode(
      undefined,
      'date',
      { type: 'number' },
      timestamp,
    );

    expect(serializer.serialize(node)).toBe('2024-01-15T10:30:00.000Z');
  });

  it('returns null for non-primitive nodes', () => {
    const serializer = new DateSerializer();
    const node = new ObjectValueNode(undefined, 'obj', { type: 'object' });

    expect(serializer.serialize(node)).toBeNull();
  });
});

describe('FileSerializer', () => {
  it('serializes file object node', () => {
    const serializer = new FileSerializer();
    const node = new ObjectValueNode(undefined, 'file', { type: 'object' }, [
      new StringValueNode(undefined, 'fileId', { type: 'string' }, 'abc123'),
      new StringValueNode(
        undefined,
        'url',
        { type: 'string' },
        'https://example.com/file.pdf',
      ),
      new StringValueNode(undefined, 'status', { type: 'string' }, 'uploaded'),
    ]);

    expect(serializer.serialize(node)).toEqual({
      fileId: 'abc123',
      url: 'https://example.com/file.pdf',
      status: 'uploaded',
    });
  });

  it('returns defaults for missing fields', () => {
    const serializer = new FileSerializer();
    const node = new ObjectValueNode(undefined, 'file', { type: 'object' }, [
      new StringValueNode(undefined, 'fileId', { type: 'string' }, 'abc123'),
    ]);

    expect(serializer.serialize(node)).toEqual({
      fileId: 'abc123',
      url: '',
      status: 'ready',
    });
  });

  it('returns null for non-object nodes', () => {
    const serializer = new FileSerializer();
    const node = new StringValueNode(
      undefined,
      'file',
      { type: 'string' },
      'test',
    );

    expect(serializer.serialize(node)).toBeNull();
  });
});

describe('Integration: registry with multiple serializers', () => {
  it('routes to correct serializer based on schema', () => {
    const registry = new SerializerRegistry();
    registry.register(new SchemaRefRule('File'), () => new FileSerializer());
    registry.register(
      new SchemaFormatRule('date-time'),
      () => new DateSerializer(),
    );

    const fileNode = new ObjectValueNode(undefined, 'file', { $ref: 'File' }, [
      new StringValueNode(undefined, 'fileId', { type: 'string' }, 'id1'),
      new StringValueNode(undefined, 'url', { type: 'string' }, 'url1'),
      new StringValueNode(undefined, 'status', { type: 'string' }, 'ready'),
    ]);

    const dateNode = new StringValueNode(
      undefined,
      'date',
      { type: 'string', format: 'date-time' },
      '2024-01-15T10:30:00Z',
    );

    const fileSerializer = registry.get({ $ref: 'File' });
    const dateSerializer = registry.get({
      type: 'string',
      format: 'date-time',
    });

    expect(fileSerializer?.serialize(fileNode)).toEqual({
      fileId: 'id1',
      url: 'url1',
      status: 'ready',
    });

    expect(dateSerializer?.serialize(dateNode)).toBe('2024-01-15T10:30:00Z');
  });
});
