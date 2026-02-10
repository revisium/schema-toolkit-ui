import { InlineEditModel } from '../InlineEditModel';

describe('InlineEditModel', () => {
  let model: InlineEditModel;

  beforeEach(() => {
    model = new InlineEditModel();
    model.setNavigationContext(
      ['name', 'age', 'email'],
      ['row-1', 'row-2', 'row-3'],
    );
  });

  describe('focus', () => {
    it('focusCell sets focused cell', () => {
      model.focusCell({ rowId: 'row-1', field: 'name' });
      expect(model.focusedCell).toEqual({ rowId: 'row-1', field: 'name' });
    });

    it('focusCell changes focused cell', () => {
      model.focusCell({ rowId: 'row-1', field: 'name' });
      model.focusCell({ rowId: 'row-2', field: 'age' });
      expect(model.focusedCell).toEqual({ rowId: 'row-2', field: 'age' });
    });

    it('blur clears focused cell', () => {
      model.focusCell({ rowId: 'row-1', field: 'name' });
      model.blur();
      expect(model.focusedCell).toBeNull();
    });

    it('isEditing false initially', () => {
      expect(model.isEditing).toBe(false);
    });
  });

  describe('edit mode', () => {
    it('startEdit enters editing', () => {
      model.focusCell({ rowId: 'row-1', field: 'name' });
      model.startEdit();
      expect(model.isEditing).toBe(true);
    });

    it('commitEdit exits editing', () => {
      model.focusCell({ rowId: 'row-1', field: 'name' });
      model.startEdit();
      model.commitEdit();
      expect(model.isEditing).toBe(false);
    });

    it('cancelEdit exits editing', () => {
      model.focusCell({ rowId: 'row-1', field: 'name' });
      model.startEdit();
      model.cancelEdit();
      expect(model.isEditing).toBe(false);
    });

    it('startEdit without focus is noop', () => {
      model.startEdit();
      expect(model.isEditing).toBe(false);
    });
  });

  describe('keyboard navigation', () => {
    it('moveDown moves to next row, same column', () => {
      model.focusCell({ rowId: 'row-1', field: 'age' });
      model.moveDown();
      expect(model.focusedCell).toEqual({ rowId: 'row-2', field: 'age' });
    });

    it('moveUp moves to prev row, same column', () => {
      model.focusCell({ rowId: 'row-2', field: 'age' });
      model.moveUp();
      expect(model.focusedCell).toEqual({ rowId: 'row-1', field: 'age' });
    });

    it('moveRight moves to next column, same row', () => {
      model.focusCell({ rowId: 'row-1', field: 'name' });
      model.moveRight();
      expect(model.focusedCell).toEqual({ rowId: 'row-1', field: 'age' });
    });

    it('moveLeft moves to prev column, same row', () => {
      model.focusCell({ rowId: 'row-1', field: 'age' });
      model.moveLeft();
      expect(model.focusedCell).toEqual({ rowId: 'row-1', field: 'name' });
    });

    it('Tab wraps to next row, Shift+Tab wraps to prev row', () => {
      model.focusCell({ rowId: 'row-1', field: 'email' });
      model.handleTab(false);
      expect(model.focusedCell).toEqual({ rowId: 'row-2', field: 'name' });

      model.focusCell({ rowId: 'row-2', field: 'name' });
      model.handleTab(true);
      expect(model.focusedCell).toEqual({ rowId: 'row-1', field: 'email' });
    });
  });
});
