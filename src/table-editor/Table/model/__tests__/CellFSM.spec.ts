import { CellFSM } from '../CellFSM';

describe('CellFSM', () => {
  let fsm: CellFSM;

  beforeEach(() => {
    fsm = new CellFSM();
    fsm.setNavigationContext(
      ['name', 'age', 'email'],
      ['row-1', 'row-2', 'row-3'],
    );
  });

  describe('focus transitions', () => {
    it('idle → FOCUS → focused (sets focusedCell)', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      expect(fsm.state).toBe('focused');
      expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'name' });
    });

    it('focused → FOCUS different cell → focused (changes focusedCell)', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.focusCell({ rowId: 'row-2', field: 'age' });
      expect(fsm.state).toBe('focused');
      expect(fsm.focusedCell).toEqual({ rowId: 'row-2', field: 'age' });
    });

    it('focused → BLUR → idle', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.blur();
      expect(fsm.state).toBe('idle');
      expect(fsm.focusedCell).toBeNull();
    });
  });

  describe('edit transitions', () => {
    it('focused → DOUBLE_CLICK → editing (trigger: doubleClick with clickOffset)', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.doubleClick(42);
      expect(fsm.state).toBe('editing');
      expect(fsm.editTrigger).toEqual({ type: 'doubleClick', clickOffset: 42 });
    });

    it('focused → DOUBLE_CLICK → editing (trigger: doubleClick without clickOffset)', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.doubleClick();
      expect(fsm.state).toBe('editing');
      expect(fsm.editTrigger).toEqual({
        type: 'doubleClick',
        clickOffset: undefined,
      });
    });

    it('focused → ENTER → editing (trigger: enter)', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.enterEdit();
      expect(fsm.state).toBe('editing');
      expect(fsm.editTrigger).toEqual({ type: 'enter' });
    });

    it('focused → TYPE_CHAR → editing (trigger: char with char value)', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.typeChar('X');
      expect(fsm.state).toBe('editing');
      expect(fsm.editTrigger).toEqual({ type: 'char', char: 'X' });
    });

    it('focused → re-focus same cell + TYPE_CHAR → editing (CellVM.startEditWithChar path)', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      expect(fsm.state).toBe('focused');

      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.typeChar('1');

      expect(fsm.state).toBe('editing');
      expect(fsm.editTrigger).toEqual({ type: 'char', char: '1' });
    });

    it('editing → COMMIT → focused (clears trigger)', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.enterEdit();
      fsm.commit();
      expect(fsm.state).toBe('focused');
      expect(fsm.editTrigger).toBeNull();
      expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'name' });
    });

    it('editing → CANCEL → focused (clears trigger)', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.enterEdit();
      fsm.cancel();
      expect(fsm.state).toBe('focused');
      expect(fsm.editTrigger).toBeNull();
      expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'name' });
    });

    it('editing → BLUR → idle', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.enterEdit();
      fsm.blur();
      expect(fsm.state).toBe('idle');
      expect(fsm.focusedCell).toBeNull();
      expect(fsm.editTrigger).toBeNull();
    });

    it('editing → FOCUS → focused (implicit commit, change cell)', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.enterEdit();
      fsm.focusCell({ rowId: 'row-2', field: 'age' });
      expect(fsm.state).toBe('focused');
      expect(fsm.focusedCell).toEqual({ rowId: 'row-2', field: 'age' });
      expect(fsm.editTrigger).toBeNull();
    });
  });

  describe('navigation', () => {
    it('focused → MOVE_DOWN → focused (next row)', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'age' });
      fsm.moveDown();
      expect(fsm.focusedCell).toEqual({ rowId: 'row-2', field: 'age' });
    });

    it('focused → MOVE_UP → focused (prev row)', () => {
      fsm.focusCell({ rowId: 'row-2', field: 'age' });
      fsm.moveUp();
      expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'age' });
    });

    it('focused → MOVE_RIGHT → focused (next column)', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.moveRight();
      expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'age' });
    });

    it('focused → MOVE_LEFT → focused (prev column)', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'age' });
      fsm.moveLeft();
      expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'name' });
    });

    it('focused → TAB → focused (next cell with wrapping)', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'email' });
      fsm.handleTab(false);
      expect(fsm.focusedCell).toEqual({ rowId: 'row-2', field: 'name' });
    });

    it('focused → SHIFT+TAB → focused (prev cell with wrapping)', () => {
      fsm.focusCell({ rowId: 'row-2', field: 'name' });
      fsm.handleTab(true);
      expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'email' });
    });

    it('arrow at top boundary stays put', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.moveUp();
      expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'name' });
    });

    it('arrow at left boundary stays put', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.moveLeft();
      expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'name' });
    });

    it('arrow at bottom boundary stays put', () => {
      fsm.focusCell({ rowId: 'row-3', field: 'name' });
      fsm.moveDown();
      expect(fsm.focusedCell).toEqual({ rowId: 'row-3', field: 'name' });
    });

    it('arrow at right boundary stays put', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'email' });
      fsm.moveRight();
      expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'email' });
    });

    it('tab wraps from last cell of last row stays put', () => {
      fsm.focusCell({ rowId: 'row-3', field: 'email' });
      fsm.handleTab(false);
      expect(fsm.focusedCell).toEqual({ rowId: 'row-3', field: 'email' });
    });

    it('shift+tab from first cell of first row stays put', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.handleTab(true);
      expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'name' });
    });
  });

  describe('guards', () => {
    it('idle → DOUBLE_CLICK → idle (no-op)', () => {
      fsm.doubleClick(10);
      expect(fsm.state).toBe('idle');
    });

    it('idle → ENTER → idle (no-op)', () => {
      fsm.enterEdit();
      expect(fsm.state).toBe('idle');
    });

    it('idle → TYPE_CHAR → idle (no-op)', () => {
      fsm.typeChar('X');
      expect(fsm.state).toBe('idle');
    });

    it('editing → MOVE_* → editing (no-op)', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.enterEdit();
      fsm.moveDown();
      expect(fsm.state).toBe('editing');
      expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'name' });
    });
  });

  describe('edit trigger data', () => {
    it('doubleClick stores clickOffset in context', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.doubleClick(100);
      expect(fsm.editTrigger).toEqual({
        type: 'doubleClick',
        clickOffset: 100,
      });
    });

    it('typeChar stores char in context', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.typeChar('A');
      expect(fsm.editTrigger).toEqual({ type: 'char', char: 'A' });
    });

    it('enter sets trigger type enter', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.enterEdit();
      expect(fsm.editTrigger).toEqual({ type: 'enter' });
    });

    it('commit clears trigger', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.typeChar('B');
      fsm.commit();
      expect(fsm.editTrigger).toBeNull();
    });

    it('cancel clears trigger', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.doubleClick(5);
      fsm.cancel();
      expect(fsm.editTrigger).toBeNull();
    });
  });

  describe('isCellFocused / isCellEditing', () => {
    it('isCellFocused returns true for focused cell', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      expect(fsm.isCellFocused('row-1', 'name')).toBe(true);
      expect(fsm.isCellFocused('row-1', 'age')).toBe(false);
      expect(fsm.isCellFocused('row-2', 'name')).toBe(false);
    });

    it('isCellEditing returns true only when editing that cell', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      expect(fsm.isCellEditing('row-1', 'name')).toBe(false);
      fsm.enterEdit();
      expect(fsm.isCellEditing('row-1', 'name')).toBe(true);
      expect(fsm.isCellEditing('row-1', 'age')).toBe(false);
    });

    it('isCellFocused returns false in idle', () => {
      expect(fsm.isCellFocused('row-1', 'name')).toBe(false);
    });
  });

  describe('focus clears editTrigger', () => {
    it('focusing another cell while focused clears trigger', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.focusCell({ rowId: 'row-2', field: 'age' });
      expect(fsm.editTrigger).toBeNull();
    });
  });
});
