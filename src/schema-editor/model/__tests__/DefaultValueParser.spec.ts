import { parseDefaultValue } from '../validation/DefaultValueParser';
import { NodeType } from '../node/NodeType';

describe('parseDefaultValue', () => {
  describe('string type', () => {
    it('returns string value as is', () => {
      expect(parseDefaultValue('hello', NodeType.String)).toBe('hello');
    });

    it('returns empty string as is', () => {
      expect(parseDefaultValue('', NodeType.String)).toBeUndefined();
    });

    it('returns numeric string as string', () => {
      expect(parseDefaultValue('123', NodeType.String)).toBe('123');
    });
  });

  describe('number type', () => {
    it('parses integer', () => {
      expect(parseDefaultValue('42', NodeType.Number)).toBe(42);
    });

    it('parses float', () => {
      expect(parseDefaultValue('3.14', NodeType.Number)).toBe(3.14);
    });

    it('parses negative number', () => {
      expect(parseDefaultValue('-10', NodeType.Number)).toBe(-10);
    });

    it('parses zero', () => {
      expect(parseDefaultValue('0', NodeType.Number)).toBe(0);
    });

    it('returns undefined for empty string', () => {
      expect(parseDefaultValue('', NodeType.Number)).toBeUndefined();
    });

    it('returns undefined for non-numeric string', () => {
      expect(parseDefaultValue('abc', NodeType.Number)).toBeUndefined();
    });

    it('returns undefined for NaN result', () => {
      expect(
        parseDefaultValue('not a number', NodeType.Number),
      ).toBeUndefined();
    });
  });

  describe('boolean type', () => {
    it('parses "true"', () => {
      expect(parseDefaultValue('true', NodeType.Boolean)).toBe(true);
    });

    it('parses "false"', () => {
      expect(parseDefaultValue('false', NodeType.Boolean)).toBe(false);
    });

    it('parses "TRUE" (case insensitive)', () => {
      expect(parseDefaultValue('TRUE', NodeType.Boolean)).toBe(true);
    });

    it('parses "False" (case insensitive)', () => {
      expect(parseDefaultValue('False', NodeType.Boolean)).toBe(false);
    });

    it('returns undefined for empty string', () => {
      expect(parseDefaultValue('', NodeType.Boolean)).toBeUndefined();
    });

    it('returns undefined for invalid boolean string', () => {
      expect(parseDefaultValue('yes', NodeType.Boolean)).toBeUndefined();
    });

    it('returns undefined for "1"', () => {
      expect(parseDefaultValue('1', NodeType.Boolean)).toBeUndefined();
    });
  });

  describe('other types', () => {
    it('returns undefined for object type', () => {
      expect(parseDefaultValue('test', NodeType.Object)).toBeUndefined();
    });

    it('returns undefined for array type', () => {
      expect(parseDefaultValue('test', NodeType.Array)).toBeUndefined();
    });

    it('returns undefined for ref type', () => {
      expect(parseDefaultValue('test', NodeType.Ref)).toBeUndefined();
    });
  });
});
