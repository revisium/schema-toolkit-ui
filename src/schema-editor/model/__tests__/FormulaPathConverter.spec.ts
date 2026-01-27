import { FormulaPathConverter } from '../formula/FormulaPathConverter';
import { SimplePath } from '../path/SimplePath';
import { EMPTY_PATH } from '../path/Paths';

describe('FormulaPathConverter', () => {
  let converter: FormulaPathConverter;

  beforeEach(() => {
    converter = new FormulaPathConverter();
  });

  describe('pathToAbsolute()', () => {
    it('converts simple path to absolute', () => {
      const path = new SimplePath('fieldName');
      expect(converter.pathToAbsolute(path)).toBe('/fieldName');
    });

    it('converts nested path to absolute', () => {
      const path = new SimplePath('parent.child.value');
      expect(converter.pathToAbsolute(path)).toBe('/parent.child.value');
    });

    it('converts empty path to slash', () => {
      expect(converter.pathToAbsolute(EMPTY_PATH)).toBe('/');
    });

    it('converts path with array access to absolute', () => {
      const path = new SimplePath('items[*].price');
      expect(converter.pathToAbsolute(path)).toBe('/items[*].price');
    });
  });

  describe('computeRelativePath()', () => {
    it('returns simple name for sibling', () => {
      const fromPath = new SimplePath('price');
      const toPath = new SimplePath('quantity');
      expect(converter.computeRelativePath(fromPath, toPath)).toBe('quantity');
    });

    it('returns nested path for deeper sibling', () => {
      const fromPath = new SimplePath('fieldA');
      const toPath = new SimplePath('nested.value');
      expect(converter.computeRelativePath(fromPath, toPath)).toBe(
        'nested.value',
      );
    });

    it('returns ../ for parent level', () => {
      const fromPath = new SimplePath('parent.child');
      const toPath = new SimplePath('sibling');
      expect(converter.computeRelativePath(fromPath, toPath)).toBe(
        '../sibling',
      );
    });

    it('returns ../../ for grandparent level', () => {
      const fromPath = new SimplePath('level1.level2.level3');
      const toPath = new SimplePath('other');
      expect(converter.computeRelativePath(fromPath, toPath)).toBe(
        '../../other',
      );
    });

    it('returns null for same path (no relative needed)', () => {
      const fromPath = new SimplePath('field');
      const toPath = EMPTY_PATH;
      expect(converter.computeRelativePath(fromPath, toPath)).toBeNull();
    });

    it('returns nested path when target is deeper in shared parent', () => {
      const fromPath = new SimplePath('parent.fieldA');
      const toPath = new SimplePath('parent.nested.value');
      expect(converter.computeRelativePath(fromPath, toPath)).toBe(
        'nested.value',
      );
    });
  });

  describe('isComplexRelativePath()', () => {
    it('returns false for simple identifier', () => {
      expect(converter.isComplexRelativePath('fieldName')).toBe(false);
    });

    it('returns false for dotted path', () => {
      expect(converter.isComplexRelativePath('parent.child')).toBe(false);
    });

    it('returns false for single ../', () => {
      expect(converter.isComplexRelativePath('../sibling')).toBe(false);
    });

    it('returns true for ../../', () => {
      expect(converter.isComplexRelativePath('../../field')).toBe(true);
    });

    it('returns true for ../../../', () => {
      expect(converter.isComplexRelativePath('../../../field')).toBe(true);
    });
  });

  describe('isSimpleName()', () => {
    it('returns true for simple identifier', () => {
      expect(converter.isSimpleName('fieldName')).toBe(true);
    });

    it('returns false for dotted path', () => {
      expect(converter.isSimpleName('parent.child')).toBe(false);
    });

    it('returns false for relative path', () => {
      expect(converter.isSimpleName('../sibling')).toBe(false);
    });

    it('returns false for absolute path', () => {
      expect(converter.isSimpleName('/root.field')).toBe(false);
    });
  });
});
