import { describe, it, expect } from '@jest/globals';
import { jsonPointerToPath } from '../PathParser';

describe('jsonPointerToPath', () => {
  it('returns empty path for empty string', () => {
    const path = jsonPointerToPath('');
    expect(path.isEmpty()).toBe(true);
  });

  it('returns empty path for root slash', () => {
    const path = jsonPointerToPath('/');
    expect(path.isEmpty()).toBe(true);
  });

  it('parses single property', () => {
    const path = jsonPointerToPath('/properties/name');

    expect(path.length()).toBe(1);
    expect(path.segments()[0]?.isProperty()).toBe(true);
    expect(path.segments()[0]?.propertyName()).toBe('name');
  });

  it('parses nested properties', () => {
    const path = jsonPointerToPath('/properties/user/properties/name');

    expect(path.length()).toBe(2);
    expect(path.segments()[0]?.propertyName()).toBe('user');
    expect(path.segments()[1]?.propertyName()).toBe('name');
  });

  it('parses items segment', () => {
    const path = jsonPointerToPath('/properties/list/items');

    expect(path.length()).toBe(2);
    expect(path.segments()[0]?.isProperty()).toBe(true);
    expect(path.segments()[1]?.isItems()).toBe(true);
  });

  it('parses items with nested property', () => {
    const path = jsonPointerToPath('/properties/list/items/properties/name');

    expect(path.length()).toBe(3);
    expect(path.segments()[0]?.propertyName()).toBe('list');
    expect(path.segments()[1]?.isItems()).toBe(true);
    expect(path.segments()[2]?.propertyName()).toBe('name');
  });

  it('throws on invalid segment', () => {
    expect(() => jsonPointerToPath('/invalid')).toThrow(
      'Invalid path segment: invalid in path /invalid',
    );
  });
});
