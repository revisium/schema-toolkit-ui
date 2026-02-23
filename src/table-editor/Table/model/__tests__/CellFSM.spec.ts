import { autorun } from 'mobx';
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

  describe('drag start during editing', () => {
    it('editing → DRAG_START another cell → focused (exits editing, moves focus)', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.enterEdit();
      expect(fsm.state).toBe('editing');

      fsm.dragStart({ rowId: 'row-2', field: 'age' });

      expect(fsm.state).toBe('focused');
      expect(fsm.focusedCell).toEqual({ rowId: 'row-2', field: 'age' });
      expect(fsm.anchorCell).toEqual({ rowId: 'row-2', field: 'age' });
      expect(fsm.editTrigger).toBeNull();
    });

    it('editing → DRAG_START same cell → focused (exits editing)', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.enterEdit();
      expect(fsm.state).toBe('editing');

      fsm.dragStart({ rowId: 'row-1', field: 'name' });

      expect(fsm.state).toBe('focused');
      expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'name' });
      expect(fsm.anchorCell).toEqual({ rowId: 'row-1', field: 'name' });
      expect(fsm.editTrigger).toBeNull();
    });

    it('editing → DRAG_START → DRAG_EXTEND creates range from new anchor', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.enterEdit();

      fsm.dragStart({ rowId: 'row-2', field: 'age' });
      expect(fsm.state).toBe('focused');

      fsm.dragExtend({ rowId: 'row-3', field: 'email' });
      expect(fsm.hasSelection).toBe(true);
      expect(fsm.anchorCell).toEqual({ rowId: 'row-2', field: 'age' });
      expect(fsm.focusedCell).toEqual({ rowId: 'row-3', field: 'email' });
    });
  });

  describe('focus clears editTrigger', () => {
    it('focusing another cell while focused clears trigger', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.focusCell({ rowId: 'row-2', field: 'age' });
      expect(fsm.editTrigger).toBeNull();
    });
  });

  describe('updateNavigationContext', () => {
    describe('idle state', () => {
      it('updates columns and rowIds', () => {
        fsm.updateNavigationContext(['name', 'age'], ['row-1', 'row-2']);

        fsm.focusCell({ rowId: 'row-1', field: 'name' });
        fsm.moveRight();
        expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'age' });

        fsm.moveRight();
        expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'age' });
      });

      it('stays idle when no cell is focused', () => {
        fsm.updateNavigationContext(['name'], ['row-1']);
        expect(fsm.state).toBe('idle');
        expect(fsm.focusedCell).toBeNull();
      });
    });

    describe('focused cell retained when still valid', () => {
      it('keeps focused cell when column and row still exist', () => {
        fsm.focusCell({ rowId: 'row-2', field: 'age' });
        expect(fsm.focusedCell).toEqual({ rowId: 'row-2', field: 'age' });

        fsm.updateNavigationContext(
          ['name', 'age', 'email'],
          ['row-1', 'row-2', 'row-3'],
        );

        expect(fsm.state).toBe('focused');
        expect(fsm.focusedCell).toEqual({ rowId: 'row-2', field: 'age' });
      });

      it('keeps focused cell after column reorder', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'age' });

        fsm.updateNavigationContext(
          ['email', 'age', 'name'],
          ['row-1', 'row-2', 'row-3'],
        );

        expect(fsm.state).toBe('focused');
        expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'age' });
      });

      it('keeps focused cell after adding a column', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'name' });

        fsm.updateNavigationContext(
          ['name', 'age', 'email', 'city'],
          ['row-1', 'row-2', 'row-3'],
        );

        expect(fsm.state).toBe('focused');
        expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'name' });
      });
    });

    describe('focused cell cleared when invalid', () => {
      it('blurs when focused column is hidden', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'age' });

        fsm.updateNavigationContext(
          ['name', 'email'],
          ['row-1', 'row-2', 'row-3'],
        );

        expect(fsm.state).toBe('idle');
        expect(fsm.focusedCell).toBeNull();
      });

      it('blurs when focused row is removed', () => {
        fsm.focusCell({ rowId: 'row-3', field: 'name' });

        fsm.updateNavigationContext(
          ['name', 'age', 'email'],
          ['row-1', 'row-2'],
        );

        expect(fsm.state).toBe('idle');
        expect(fsm.focusedCell).toBeNull();
      });

      it('blurs when both column and row are removed', () => {
        fsm.focusCell({ rowId: 'row-3', field: 'email' });

        fsm.updateNavigationContext(['name'], ['row-1']);

        expect(fsm.state).toBe('idle');
        expect(fsm.focusedCell).toBeNull();
      });
    });

    describe('range selection cleared', () => {
      it('clears range selection but keeps focused cell', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'name' });
        fsm.selectTo({ rowId: 'row-2', field: 'age' });
        expect(fsm.hasSelection).toBe(true);
        expect(fsm.anchorCell).toBeTruthy();

        fsm.updateNavigationContext(
          ['name', 'age', 'email'],
          ['row-1', 'row-2', 'row-3'],
        );

        expect(fsm.hasSelection).toBe(false);
        expect(fsm.anchorCell).toBeNull();
        expect(fsm.state).toBe('focused');
        expect(fsm.focusedCell).toEqual({ rowId: 'row-2', field: 'age' });
      });

      it('clears range when hiding a column outside the focused cell', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'name' });
        fsm.selectTo({ rowId: 'row-2', field: 'age' });
        expect(fsm.hasSelection).toBe(true);

        fsm.updateNavigationContext(
          ['name', 'age'],
          ['row-1', 'row-2', 'row-3'],
        );

        expect(fsm.hasSelection).toBe(false);
        expect(fsm.anchorCell).toBeNull();
        expect(fsm.focusedCell).toEqual({ rowId: 'row-2', field: 'age' });
      });

      it('clears range and blurs when focused cell column is hidden', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'name' });
        fsm.selectTo({ rowId: 'row-2', field: 'email' });

        fsm.updateNavigationContext(
          ['name', 'age'],
          ['row-1', 'row-2', 'row-3'],
        );

        expect(fsm.state).toBe('idle');
        expect(fsm.focusedCell).toBeNull();
        expect(fsm.anchorCell).toBeNull();
        expect(fsm.hasSelection).toBe(false);
      });
    });

    describe('editing state', () => {
      it('keeps editing when cell still valid', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'name' });
        fsm.enterEdit();
        expect(fsm.state).toBe('editing');

        fsm.updateNavigationContext(
          ['name', 'age', 'email'],
          ['row-1', 'row-2', 'row-3'],
        );

        expect(fsm.state).toBe('editing');
        expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'name' });
      });

      it('cancels editing and blurs when column is hidden', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'age' });
        fsm.enterEdit();
        expect(fsm.state).toBe('editing');

        fsm.updateNavigationContext(
          ['name', 'email'],
          ['row-1', 'row-2', 'row-3'],
        );

        expect(fsm.state).toBe('idle');
        expect(fsm.focusedCell).toBeNull();
        expect(fsm.editTrigger).toBeNull();
      });

      it('cancels editing and blurs when row is removed', () => {
        fsm.focusCell({ rowId: 'row-3', field: 'name' });
        fsm.enterEdit();

        fsm.updateNavigationContext(
          ['name', 'age', 'email'],
          ['row-1', 'row-2'],
        );

        expect(fsm.state).toBe('idle');
        expect(fsm.focusedCell).toBeNull();
        expect(fsm.editTrigger).toBeNull();
      });
    });

    describe('FSM responsiveness after adding column', () => {
      it('arrows work after adding a column while focused', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'name' });
        expect(fsm.state).toBe('focused');

        fsm.updateNavigationContext(
          ['name', 'age', 'email', 'city'],
          ['row-1', 'row-2', 'row-3'],
        );

        expect(fsm.state).toBe('focused');
        expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'name' });

        fsm.moveRight();
        expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'age' });
      });

      it('FOCUS on same cell works after adding a column', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'name' });

        fsm.updateNavigationContext(
          ['name', 'age', 'email', 'city'],
          ['row-1', 'row-2', 'row-3'],
        );

        fsm.focusCell({ rowId: 'row-1', field: 'name' });
        expect(fsm.state).toBe('focused');
        expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'name' });
      });

      it('ENTER works after adding a column while focused', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'name' });

        fsm.updateNavigationContext(
          ['name', 'age', 'email', 'city'],
          ['row-1', 'row-2', 'row-3'],
        );

        fsm.enterEdit();
        expect(fsm.state).toBe('editing');
      });

      it('DRAG_START works after adding a column while focused', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'name' });

        fsm.updateNavigationContext(
          ['name', 'age', 'email', 'city'],
          ['row-1', 'row-2', 'row-3'],
        );

        fsm.dragStart({ rowId: 'row-1', field: 'name' });
        expect(fsm.state).toBe('focused');
        expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'name' });
      });

      it('DOUBLE_CLICK works after adding a column while focused', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'name' });

        fsm.updateNavigationContext(
          ['name', 'age', 'email', 'city'],
          ['row-1', 'row-2', 'row-3'],
        );

        fsm.doubleClick(10);
        expect(fsm.state).toBe('editing');
      });
    });

    describe('navigationVersion', () => {
      it('starts at 0', () => {
        expect(fsm.navigationVersion).toBe(0);
      });

      it('increments on updateNavigationContext when cell stays focused', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'name' });
        const before = fsm.navigationVersion;

        fsm.updateNavigationContext(
          ['name', 'age', 'email', 'city'],
          ['row-1', 'row-2', 'row-3'],
        );

        expect(fsm.navigationVersion).toBe(before + 1);
      });

      it('increments on updateNavigationContext when cell is blurred', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'age' });
        const before = fsm.navigationVersion;

        fsm.updateNavigationContext(
          ['name', 'email'],
          ['row-1', 'row-2', 'row-3'],
        );

        expect(fsm.navigationVersion).toBe(before + 1);
      });

      it('increments on updateNavigationContext in idle state', () => {
        const before = fsm.navigationVersion;

        fsm.updateNavigationContext(['name', 'age'], ['row-1', 'row-2']);

        expect(fsm.navigationVersion).toBe(before + 1);
      });

      it('does not increment on setNavigationContext', () => {
        const before = fsm.navigationVersion;

        fsm.setNavigationContext(['name', 'age'], ['row-1']);

        expect(fsm.navigationVersion).toBe(before);
      });
    });

    describe('navigation after update', () => {
      it('navigates correctly after column reorder', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'age' });

        fsm.updateNavigationContext(
          ['email', 'age', 'name'],
          ['row-1', 'row-2', 'row-3'],
        );

        fsm.moveLeft();
        expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'email' });

        fsm.moveRight();
        expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'age' });

        fsm.moveRight();
        expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'name' });
      });

      it('navigates correctly after column removal', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'name' });

        fsm.updateNavigationContext(
          ['name', 'email'],
          ['row-1', 'row-2', 'row-3'],
        );

        fsm.moveRight();
        expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'email' });

        fsm.moveRight();
        expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'email' });
      });

      it('respects new row boundaries after row removal', () => {
        fsm.focusCell({ rowId: 'row-2', field: 'name' });

        fsm.updateNavigationContext(
          ['name', 'age', 'email'],
          ['row-1', 'row-2'],
        );

        fsm.moveDown();
        expect(fsm.focusedCell).toEqual({ rowId: 'row-2', field: 'name' });
      });

      it('tab wraps correctly after column addition', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'name' });

        fsm.updateNavigationContext(
          ['name', 'age', 'email', 'city'],
          ['row-1', 'row-2', 'row-3'],
        );

        fsm.focusCell({ rowId: 'row-1', field: 'city' });
        fsm.handleTab(false);
        expect(fsm.focusedCell).toEqual({ rowId: 'row-2', field: 'name' });
      });
    });

    describe('edge cases', () => {
      it('handles empty columns', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'name' });

        fsm.updateNavigationContext([], ['row-1', 'row-2', 'row-3']);

        expect(fsm.state).toBe('idle');
        expect(fsm.focusedCell).toBeNull();
      });

      it('handles empty rows', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'name' });

        fsm.updateNavigationContext(['name', 'age', 'email'], []);

        expect(fsm.state).toBe('idle');
        expect(fsm.focusedCell).toBeNull();
      });

      it('handles both empty', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'name' });

        fsm.updateNavigationContext([], []);

        expect(fsm.state).toBe('idle');
        expect(fsm.focusedCell).toBeNull();
      });

      it('multiple sequential updates', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'name' });
        fsm.selectTo({ rowId: 'row-2', field: 'age' });

        fsm.updateNavigationContext(
          ['name', 'email'],
          ['row-1', 'row-2', 'row-3'],
        );
        expect(fsm.state).toBe('idle');
        expect(fsm.focusedCell).toBeNull();
        expect(fsm.hasSelection).toBe(false);
      });

      it('multiple sequential updates - focused cell survives first', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'name' });

        fsm.updateNavigationContext(
          ['name', 'email'],
          ['row-1', 'row-2', 'row-3'],
        );
        expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'name' });

        fsm.updateNavigationContext(['email'], ['row-1', 'row-2', 'row-3']);
        expect(fsm.state).toBe('idle');
        expect(fsm.focusedCell).toBeNull();
      });

      it('can select new range after context update', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'name' });

        fsm.updateNavigationContext(
          ['name', 'age', 'email'],
          ['row-1', 'row-2', 'row-3'],
        );

        fsm.selectTo({ rowId: 'row-3', field: 'email' });
        expect(fsm.hasSelection).toBe(true);
        const range = fsm.getSelectedRange();
        expect(range).toEqual({
          startCol: 0,
          endCol: 2,
          startRow: 0,
          endRow: 2,
        });
      });
    });

    describe('shift+arrow at boundaries', () => {
      it('shift+Up on first row keeps selection at top', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'age' });
        fsm.shiftMoveUp();

        expect(fsm.state).toBe('focused');
        expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'age' });
        expect(fsm.hasSelection).toBe(false);
      });

      it('shift+Left on first column keeps selection at left', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'name' });
        fsm.shiftMoveLeft();

        expect(fsm.state).toBe('focused');
        expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'name' });
        expect(fsm.hasSelection).toBe(false);
      });

      it('shift+Down on last row keeps selection at bottom', () => {
        fsm.focusCell({ rowId: 'row-3', field: 'age' });
        fsm.shiftMoveDown();

        expect(fsm.state).toBe('focused');
        expect(fsm.focusedCell).toEqual({ rowId: 'row-3', field: 'age' });
        expect(fsm.hasSelection).toBe(false);
      });

      it('shift+Right on last column keeps selection at right', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'email' });
        fsm.shiftMoveRight();

        expect(fsm.state).toBe('focused');
        expect(fsm.focusedCell).toEqual({ rowId: 'row-1', field: 'email' });
        expect(fsm.hasSelection).toBe(false);
      });

      it('shift+Up then shift+Down returns to single cell', () => {
        fsm.focusCell({ rowId: 'row-2', field: 'age' });
        fsm.shiftMoveUp();

        expect(fsm.hasSelection).toBe(true);
        expect(fsm.isCellInSelection('row-1', 'age')).toBe(true);
        expect(fsm.isCellInSelection('row-2', 'age')).toBe(true);

        fsm.shiftMoveDown();

        expect(fsm.hasSelection).toBe(false);
        expect(fsm.focusedCell).toEqual({ rowId: 'row-2', field: 'age' });
      });

      it('shift+arrow expands then contracts selection', () => {
        fsm.focusCell({ rowId: 'row-2', field: 'age' });

        fsm.shiftMoveDown();
        fsm.shiftMoveRight();

        expect(fsm.hasSelection).toBe(true);
        expect(fsm.isCellInSelection('row-2', 'age')).toBe(true);
        expect(fsm.isCellInSelection('row-2', 'email')).toBe(true);
        expect(fsm.isCellInSelection('row-3', 'age')).toBe(true);
        expect(fsm.isCellInSelection('row-3', 'email')).toBe(true);

        fsm.shiftMoveLeft();

        expect(fsm.hasSelection).toBe(true);
        expect(fsm.isCellInSelection('row-2', 'age')).toBe(true);
        expect(fsm.isCellInSelection('row-3', 'age')).toBe(true);
        expect(fsm.isCellInSelection('row-2', 'email')).toBe(false);
      });

      it('multiple shift+Up at boundary does not break', () => {
        fsm.focusCell({ rowId: 'row-2', field: 'name' });

        fsm.shiftMoveUp();
        fsm.shiftMoveUp();
        fsm.shiftMoveUp();

        expect(fsm.state).toBe('focused');
        expect(fsm.hasSelection).toBe(true);
        expect(fsm.isCellInSelection('row-1', 'name')).toBe(true);
        expect(fsm.isCellInSelection('row-2', 'name')).toBe(true);
      });

      it('multiple shift+Right at boundary does not break', () => {
        fsm.focusCell({ rowId: 'row-1', field: 'age' });

        fsm.shiftMoveRight();
        fsm.shiftMoveRight();
        fsm.shiftMoveRight();

        expect(fsm.state).toBe('focused');
        expect(fsm.hasSelection).toBe(true);
        expect(fsm.isCellInSelection('row-1', 'age')).toBe(true);
        expect(fsm.isCellInSelection('row-1', 'email')).toBe(true);
      });
    });

    describe('selection edges after column reorder', () => {
      it('middle column has edges after reorder and selection', () => {
        fsm.updateNavigationContext(
          ['email', 'name', 'age'],
          ['row-1', 'row-2', 'row-3'],
        );

        fsm.focusCell({ rowId: 'row-1', field: 'email' });
        fsm.selectTo({ rowId: 'row-2', field: 'age' });

        expect(fsm.hasSelection).toBe(true);

        const middleEdges = fsm.getCellSelectionEdges('row-1', 'name');
        expect(middleEdges).not.toBeNull();
        expect(middleEdges).toEqual({
          top: true,
          bottom: false,
          left: false,
          right: false,
        });
      });

      it('all cells in range report isInSelection after reorder', () => {
        fsm.updateNavigationContext(
          ['email', 'name', 'age'],
          ['row-1', 'row-2', 'row-3'],
        );

        fsm.focusCell({ rowId: 'row-1', field: 'email' });
        fsm.selectTo({ rowId: 'row-2', field: 'age' });

        expect(fsm.isCellInSelection('row-1', 'email')).toBe(true);
        expect(fsm.isCellInSelection('row-1', 'name')).toBe(true);
        expect(fsm.isCellInSelection('row-1', 'age')).toBe(true);
        expect(fsm.isCellInSelection('row-2', 'email')).toBe(true);
        expect(fsm.isCellInSelection('row-2', 'name')).toBe(true);
        expect(fsm.isCellInSelection('row-2', 'age')).toBe(true);

        expect(fsm.isCellInSelection('row-3', 'name')).toBe(false);
      });

      it('selection range spans all 3 columns after reorder', () => {
        fsm.updateNavigationContext(
          ['email', 'name', 'age'],
          ['row-1', 'row-2', 'row-3'],
        );

        fsm.focusCell({ rowId: 'row-1', field: 'email' });
        fsm.selectTo({ rowId: 'row-2', field: 'age' });

        const range = fsm.getSelectedRange();
        expect(range).toEqual({
          startCol: 0,
          endCol: 2,
          startRow: 0,
          endRow: 1,
        });
      });

      it('edges correct for all cells in range after reorder', () => {
        fsm.updateNavigationContext(
          ['email', 'name', 'age'],
          ['row-1', 'row-2'],
        );

        fsm.focusCell({ rowId: 'row-1', field: 'email' });
        fsm.selectTo({ rowId: 'row-2', field: 'age' });

        expect(fsm.getCellSelectionEdges('row-1', 'email')).toEqual({
          top: true,
          bottom: false,
          left: true,
          right: false,
        });
        expect(fsm.getCellSelectionEdges('row-1', 'name')).toEqual({
          top: true,
          bottom: false,
          left: false,
          right: false,
        });
        expect(fsm.getCellSelectionEdges('row-1', 'age')).toEqual({
          top: true,
          bottom: false,
          left: false,
          right: true,
        });
        expect(fsm.getCellSelectionEdges('row-2', 'email')).toEqual({
          top: false,
          bottom: true,
          left: true,
          right: false,
        });
        expect(fsm.getCellSelectionEdges('row-2', 'name')).toEqual({
          top: false,
          bottom: true,
          left: false,
          right: false,
        });
        expect(fsm.getCellSelectionEdges('row-2', 'age')).toEqual({
          top: false,
          bottom: true,
          left: false,
          right: true,
        });
      });
    });
  });

  describe('selection reactivity performance', () => {
    it('hasSelection autorun does not re-fire when drag-extending within existing selection', () => {
      const hasSelectionValues: boolean[] = [];
      autorun(() => {
        hasSelectionValues.push(fsm.hasSelection);
      });

      expect(hasSelectionValues).toEqual([false]);

      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.selectTo({ rowId: 'row-2', field: 'age' });

      expect(hasSelectionValues).toEqual([false, true]);

      fsm.dragExtend({ rowId: 'row-3', field: 'email' });
      fsm.dragExtend({ rowId: 'row-2', field: 'name' });
      fsm.dragExtend({ rowId: 'row-1', field: 'email' });

      expect(hasSelectionValues).toEqual([false, true]);
    });

    it('hasSelection transitions from true to false on focus', () => {
      const hasSelectionValues: boolean[] = [];
      autorun(() => {
        hasSelectionValues.push(fsm.hasSelection);
      });

      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.selectTo({ rowId: 'row-2', field: 'age' });

      expect(hasSelectionValues).toEqual([false, true]);

      fsm.focusCell({ rowId: 'row-1', field: 'name' });

      expect(hasSelectionValues).toEqual([false, true, false]);
    });

    it('focusedCell changes do not invalidate hasSelection when it stays false', () => {
      const hasSelectionValues: boolean[] = [];
      autorun(() => {
        hasSelectionValues.push(fsm.hasSelection);
      });

      expect(hasSelectionValues).toEqual([false]);

      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.focusCell({ rowId: 'row-2', field: 'age' });
      fsm.focusCell({ rowId: 'row-3', field: 'email' });

      expect(hasSelectionValues).toEqual([false]);
    });
  });

  describe('selection lookup with index maps', () => {
    it('isCellInSelection returns correct results for large grid', () => {
      const rows = Array.from({ length: 1000 }, (_, i) => `row-${i}`);
      const cols = Array.from({ length: 20 }, (_, i) => `col-${i}`);
      fsm.setNavigationContext(cols, rows);

      fsm.focusCell({ rowId: 'row-10', field: 'col-5' });
      fsm.selectTo({ rowId: 'row-500', field: 'col-15' });

      expect(fsm.isCellInSelection('row-10', 'col-5')).toBe(true);
      expect(fsm.isCellInSelection('row-250', 'col-10')).toBe(true);
      expect(fsm.isCellInSelection('row-500', 'col-15')).toBe(true);
      expect(fsm.isCellInSelection('row-9', 'col-5')).toBe(false);
      expect(fsm.isCellInSelection('row-501', 'col-10')).toBe(false);
      expect(fsm.isCellInSelection('row-250', 'col-4')).toBe(false);
      expect(fsm.isCellInSelection('row-250', 'col-16')).toBe(false);
    });

    it('getCellSelectionEdges returns correct edges for large grid', () => {
      const rows = Array.from({ length: 1000 }, (_, i) => `row-${i}`);
      const cols = Array.from({ length: 20 }, (_, i) => `col-${i}`);
      fsm.setNavigationContext(cols, rows);

      fsm.focusCell({ rowId: 'row-10', field: 'col-5' });
      fsm.selectTo({ rowId: 'row-500', field: 'col-15' });

      const topLeft = fsm.getCellSelectionEdges('row-10', 'col-5');
      expect(topLeft).toEqual({ top: true, bottom: false, left: true, right: false });

      const bottomRight = fsm.getCellSelectionEdges('row-500', 'col-15');
      expect(bottomRight).toEqual({ top: false, bottom: true, left: false, right: true });

      const middle = fsm.getCellSelectionEdges('row-250', 'col-10');
      expect(middle).toEqual({ top: false, bottom: false, left: false, right: false });

      const outside = fsm.getCellSelectionEdges('row-9', 'col-5');
      expect(outside).toBeNull();
    });

    it('index maps are populated after setNavigationContext', () => {
      const rows = Array.from({ length: 1000 }, (_, i) => `row-${i}`);
      const cols = Array.from({ length: 20 }, (_, i) => `col-${i}`);
      fsm.setNavigationContext(cols, rows);

      expect(fsm.columnIndexMap.size).toBe(20);
      expect(fsm.rowIndexMap.size).toBe(1000);
      expect(fsm.columnIndexMap.get('col-0')).toBe(0);
      expect(fsm.columnIndexMap.get('col-19')).toBe(19);
      expect(fsm.rowIndexMap.get('row-0')).toBe(0);
      expect(fsm.rowIndexMap.get('row-999')).toBe(999);
    });

    it('selectedRange is a stable computed reference', () => {
      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.selectTo({ rowId: 'row-3', field: 'email' });

      let rangeCallCount = 0;
      let lastRange: unknown = undefined;
      const dispose = autorun(() => {
        lastRange = fsm.selectedRange;
        rangeCallCount++;
      });

      expect(rangeCallCount).toBe(1);
      expect(lastRange).toEqual({
        startCol: 0,
        endCol: 2,
        startRow: 0,
        endRow: 2,
      });

      fsm.dragExtend({ rowId: 'row-3', field: 'email' });

      expect(rangeCallCount).toBe(1);

      dispose();
    });

    it('isCellInSelection autorun count is stable during drag extend', () => {
      fsm.setNavigationContext(
        ['name', 'age', 'email'],
        ['row-1', 'row-2', 'row-3', 'row-4', 'row-5'],
      );

      fsm.focusCell({ rowId: 'row-1', field: 'name' });
      fsm.selectTo({ rowId: 'row-2', field: 'age' });

      let callCount = 0;
      const dispose = autorun(() => {
        fsm.isCellInSelection('row-3', 'name');
        callCount++;
      });

      callCount = 0;

      fsm.dragExtend({ rowId: 'row-3', field: 'email' });
      fsm.dragExtend({ rowId: 'row-4', field: 'email' });
      fsm.dragExtend({ rowId: 'row-5', field: 'email' });

      expect(callCount).toBeLessThanOrEqual(3);

      dispose();
    });

    it('columnIndexMap and rowIndexMap provide O(1) position lookup', () => {
      const rows = Array.from({ length: 1000 }, (_, i) => `row-${i}`);
      const cols = Array.from({ length: 20 }, (_, i) => `col-${i}`);
      fsm.setNavigationContext(cols, rows);

      expect(fsm.columnIndexMap.get('col-0')).toBe(0);
      expect(fsm.columnIndexMap.get('col-19')).toBe(19);
      expect(fsm.rowIndexMap.get('row-0')).toBe(0);
      expect(fsm.rowIndexMap.get('row-999')).toBe(999);
    });

    it('index maps update after setNavigationContext', () => {
      fsm.setNavigationContext(['a', 'b'], ['r1', 'r2']);
      expect(fsm.columnIndexMap.get('a')).toBe(0);
      expect(fsm.rowIndexMap.get('r1')).toBe(0);

      fsm.setNavigationContext(['b', 'a'], ['r2', 'r1']);
      expect(fsm.columnIndexMap.get('a')).toBe(1);
      expect(fsm.rowIndexMap.get('r1')).toBe(1);
    });

    it('index maps update after updateNavigationContext', () => {
      fsm.updateNavigationContext(['x', 'y', 'z'], ['r1', 'r2']);
      expect(fsm.columnIndexMap.get('x')).toBe(0);
      expect(fsm.columnIndexMap.get('z')).toBe(2);
      expect(fsm.rowIndexMap.get('r2')).toBe(1);
    });
  });
});
