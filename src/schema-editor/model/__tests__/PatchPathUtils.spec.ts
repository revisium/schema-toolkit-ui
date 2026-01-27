import { PatchPathUtils } from '../diff/PatchPathUtils';

describe('PatchPathUtils', () => {
  const utils = new PatchPathUtils();

  describe('getFieldNameFromPath', () => {
    it('returns simple field name from JSON pointer', () => {
      expect(utils.getFieldNameFromPath('/properties/name')).toBe('name');
    });

    it('returns nested field name', () => {
      expect(
        utils.getFieldNameFromPath('/properties/user/properties/email'),
      ).toBe('user.email');
    });

    it('returns array items path', () => {
      expect(utils.getFieldNameFromPath('/properties/items/items')).toBe(
        'items[*]',
      );
    });

    it('returns empty string for invalid path', () => {
      expect(utils.getFieldNameFromPath('invalid')).toBe('');
    });
  });

  describe('isRenameMove', () => {
    it('returns true when parent paths match', () => {
      expect(
        utils.isRenameMove('/properties/oldName', '/properties/newName'),
      ).toBe(true);
    });

    it('returns false when parent paths differ', () => {
      expect(
        utils.isRenameMove(
          '/properties/user/properties/name',
          '/properties/name',
        ),
      ).toBe(false);
    });
  });

  describe('movesIntoArrayBoundary', () => {
    it('returns true when moving into array', () => {
      expect(
        utils.movesIntoArrayBoundary(
          '/properties/field',
          '/properties/items/items/properties/field',
        ),
      ).toBe(true);
    });

    it('returns false when not moving into array', () => {
      expect(
        utils.movesIntoArrayBoundary('/properties/field', '/properties/other'),
      ).toBe(false);
    });
  });

  describe('getParentPath', () => {
    it('returns parent for nested path', () => {
      expect(
        utils.isRenameMove(
          '/properties/user/properties/old',
          '/properties/user/properties/new',
        ),
      ).toBe(true);
    });
  });
});
