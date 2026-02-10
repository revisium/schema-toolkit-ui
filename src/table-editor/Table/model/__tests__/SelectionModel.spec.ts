import { SelectionModel } from '../SelectionModel';

describe('SelectionModel', () => {
  let model: SelectionModel;

  beforeEach(() => {
    model = new SelectionModel();
  });

  it('initial state — no selection', () => {
    expect(model.isSelectionMode).toBe(false);
    expect(model.selectedCount).toBe(0);
    expect(model.selectedIds).toEqual([]);
  });

  it('toggle selects row', () => {
    model.toggle('row-1');
    expect(model.isSelected('row-1')).toBe(true);
    expect(model.selectedCount).toBe(1);
  });

  it('toggle deselects selected row', () => {
    model.toggle('row-1');
    model.toggle('row-1');
    expect(model.isSelected('row-1')).toBe(false);
    expect(model.selectedCount).toBe(0);
  });

  it('isSelected per-key tracking', () => {
    model.toggle('row-1');
    model.toggle('row-2');
    expect(model.isSelected('row-1')).toBe(true);
    expect(model.isSelected('row-2')).toBe(true);
    expect(model.isSelected('row-3')).toBe(false);
  });

  it('selectAll selects multiple rows', () => {
    model.selectAll(['row-1', 'row-2', 'row-3']);
    expect(model.selectedCount).toBe(3);
    expect(model.isSelected('row-1')).toBe(true);
    expect(model.isSelected('row-2')).toBe(true);
    expect(model.isSelected('row-3')).toBe(true);
  });

  it('deselectAll clears selection', () => {
    model.selectAll(['row-1', 'row-2']);
    model.deselectAll();
    expect(model.selectedCount).toBe(0);
    expect(model.isSelected('row-1')).toBe(false);
  });

  it('selectedCount reflects count', () => {
    model.toggle('row-1');
    model.toggle('row-2');
    expect(model.selectedCount).toBe(2);
    model.toggle('row-1');
    expect(model.selectedCount).toBe(1);
  });

  it('selectedIds returns array of selected', () => {
    model.toggle('row-1');
    model.toggle('row-2');
    expect(model.selectedIds).toEqual(
      expect.arrayContaining(['row-1', 'row-2']),
    );
    expect(model.selectedIds).toHaveLength(2);
  });

  it('isSelectionMode true when any selected', () => {
    expect(model.isSelectionMode).toBe(false);
    model.toggle('row-1');
    expect(model.isSelectionMode).toBe(true);
    model.toggle('row-1');
    expect(model.isSelectionMode).toBe(false);
  });

  it('exitSelectionMode clears all', () => {
    model.selectAll(['row-1', 'row-2', 'row-3']);
    model.exitSelectionMode();
    expect(model.isSelectionMode).toBe(false);
    expect(model.selectedCount).toBe(0);
  });
});
