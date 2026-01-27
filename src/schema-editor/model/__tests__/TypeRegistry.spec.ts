import { TypeRegistry } from '../registry/TypeRegistry';
import { stringTypeDescriptor } from '../types/StringTypeDescriptor';
import { numberTypeDescriptor } from '../types/NumberTypeDescriptor';
import { booleanTypeDescriptor } from '../types/BooleanTypeDescriptor';
import { objectTypeDescriptor } from '../types/ObjectTypeDescriptor';
import { arrayTypeDescriptor } from '../types/ArrayTypeDescriptor';
import { refTypeDescriptor } from '../types/RefTypeDescriptor';
import { createDefaultRegistry } from '../types';

describe('TypeRegistry', () => {
  describe('register()', () => {
    it('registers a type descriptor', () => {
      const registry = new TypeRegistry();
      registry.register(stringTypeDescriptor);

      expect(registry.getDescriptor('string')).toBe(stringTypeDescriptor);
    });

    it('throws error when registering duplicate type', () => {
      const registry = new TypeRegistry();
      registry.register(stringTypeDescriptor);

      expect(() => registry.register(stringTypeDescriptor)).toThrow(
        'Type "string" is already registered',
      );
    });
  });

  describe('getDescriptor()', () => {
    it('returns undefined for unknown type', () => {
      const registry = new TypeRegistry();

      expect(registry.getDescriptor('unknown')).toBeUndefined();
    });

    it('returns registered descriptor', () => {
      const registry = new TypeRegistry();
      registry.register(numberTypeDescriptor);

      expect(registry.getDescriptor('number')).toBe(numberTypeDescriptor);
    });
  });

  describe('findDescriptorForSchema()', () => {
    let registry: TypeRegistry;

    beforeEach(() => {
      registry = createDefaultRegistry();
    });

    it('finds string descriptor', () => {
      const schema = { type: 'string' as const, default: '' };
      expect(registry.findDescriptorForSchema(schema)).toBe(
        stringTypeDescriptor,
      );
    });

    it('finds number descriptor', () => {
      const schema = { type: 'number' as const, default: 0 };
      expect(registry.findDescriptorForSchema(schema)).toBe(
        numberTypeDescriptor,
      );
    });

    it('finds boolean descriptor', () => {
      const schema = { type: 'boolean' as const, default: false };
      expect(registry.findDescriptorForSchema(schema)).toBe(
        booleanTypeDescriptor,
      );
    });

    it('finds object descriptor', () => {
      const schema = {
        type: 'object' as const,
        properties: {},
        required: [] as string[],
        additionalProperties: false as const,
      };
      expect(registry.findDescriptorForSchema(schema)).toBe(
        objectTypeDescriptor,
      );
    });

    it('finds array descriptor', () => {
      const schema = {
        type: 'array' as const,
        items: { type: 'string' as const, default: '' },
      };
      expect(registry.findDescriptorForSchema(schema)).toBe(
        arrayTypeDescriptor,
      );
    });

    it('finds ref descriptor', () => {
      const schema = { $ref: 'File' };
      expect(registry.findDescriptorForSchema(schema)).toBe(refTypeDescriptor);
    });

    it('returns undefined for unknown schema', () => {
      const schema = { type: 'unknown' } as never;
      expect(registry.findDescriptorForSchema(schema)).toBeUndefined();
    });
  });

  describe('getAllDescriptors()', () => {
    it('returns all registered descriptors', () => {
      const registry = new TypeRegistry();
      registry.register(stringTypeDescriptor);
      registry.register(numberTypeDescriptor);

      const descriptors = registry.getAllDescriptors();
      expect(descriptors).toHaveLength(2);
      expect(descriptors).toContain(stringTypeDescriptor);
      expect(descriptors).toContain(numberTypeDescriptor);
    });

    it('returns empty array for empty registry', () => {
      const registry = new TypeRegistry();
      expect(registry.getAllDescriptors()).toEqual([]);
    });
  });

  describe('getTypes()', () => {
    it('returns all registered type names', () => {
      const registry = new TypeRegistry();
      registry.register(stringTypeDescriptor);
      registry.register(numberTypeDescriptor);
      registry.register(booleanTypeDescriptor);

      const types = registry.getTypes();
      expect(types).toContain('string');
      expect(types).toContain('number');
      expect(types).toContain('boolean');
    });
  });
});

describe('createDefaultRegistry()', () => {
  it('creates registry with all built-in types', () => {
    const registry = createDefaultRegistry();

    expect(registry.getDescriptor('string')).toBeDefined();
    expect(registry.getDescriptor('number')).toBeDefined();
    expect(registry.getDescriptor('boolean')).toBeDefined();
    expect(registry.getDescriptor('object')).toBeDefined();
    expect(registry.getDescriptor('array')).toBeDefined();
    expect(registry.getDescriptor('ref')).toBeDefined();
  });
});
