import { ensureReactivityProvider } from '../../../../lib/initReactivity';
import { CellFSM } from '../../../Table/model/CellFSM';
import { ColumnsModel } from '../../../Columns/model/ColumnsModel';
import { CellInfoModel } from '../CellInfoModel';
import { FilterFieldType } from '../../../shared/field-types';

ensureReactivityProvider();

function makeColumnsModel(fields: string[]): ColumnsModel {
  const model = new ColumnsModel();
  model.init(
    fields.map((f) => ({
      field: f,
      label: f,
      fieldType: FilterFieldType.String,
      isSystem: false,
      isDeprecated: false,
      hasFormula: false,
      isSortable: true,
    })),
  );
  model.reorderColumns(fields);
  return model;
}

function makeFSMWithNavigation(fields: string[], rowIds: string[]): CellFSM {
  const fsm = new CellFSM();
  fsm.setNavigationContext(fields, rowIds);
  return fsm;
}

describe('CellInfoModel', () => {
  describe('isVisible', () => {
    it('false when no cell focused', () => {
      const fsm = makeFSMWithNavigation(['data.name'], ['row-1']);
      const columns = makeColumnsModel(['data.name']);
      const model = new CellInfoModel(fsm, columns);

      expect(model.isVisible).toBe(false);
    });

    it('true when a single cell is focused', () => {
      const fsm = makeFSMWithNavigation(['data.name'], ['row-1']);
      const columns = makeColumnsModel(['data.name']);
      const model = new CellInfoModel(fsm, columns);

      fsm.focusCell({ rowId: 'row-1', field: 'data.name' });

      expect(model.isVisible).toBe(true);
    });

    it('false when range selection is active (multiple cells)', () => {
      const fsm = makeFSMWithNavigation(
        ['data.name', 'data.age'],
        ['row-1', 'row-2'],
      );
      const columns = makeColumnsModel(['data.name', 'data.age']);
      const model = new CellInfoModel(fsm, columns);

      // focus anchor cell, then extend selection to another cell
      fsm.focusCell({ rowId: 'row-1', field: 'data.name' });
      fsm.selectTo({ rowId: 'row-2', field: 'data.age' });

      expect(fsm.hasSelection).toBe(true);
      expect(model.isVisible).toBe(false);
    });

    it('true again after selection is cleared (single cell focus)', () => {
      const fsm = makeFSMWithNavigation(
        ['data.name', 'data.age'],
        ['row-1', 'row-2'],
      );
      const columns = makeColumnsModel(['data.name', 'data.age']);
      const model = new CellInfoModel(fsm, columns);

      fsm.focusCell({ rowId: 'row-1', field: 'data.name' });
      fsm.selectTo({ rowId: 'row-2', field: 'data.age' });
      expect(model.isVisible).toBe(false);

      // clicking a single cell clears the range
      fsm.focusCell({ rowId: 'row-1', field: 'data.name' });
      expect(fsm.hasSelection).toBe(false);
      expect(model.isVisible).toBe(true);
    });
  });

  describe('fieldLabel', () => {
    it('returns the label of the focused column', () => {
      const fsm = makeFSMWithNavigation(['data.name', 'data.age'], ['row-1']);
      const columns = makeColumnsModel(['data.name', 'data.age']);
      const model = new CellInfoModel(fsm, columns);

      fsm.focusCell({ rowId: 'row-1', field: 'data.age' });

      expect(model.fieldLabel).toBe('data.age');
    });
  });

  describe('formulaExpression', () => {
    it('undefined for plain field', () => {
      const fsm = makeFSMWithNavigation(['data.name'], ['row-1']);
      const columns = makeColumnsModel(['data.name']);
      const model = new CellInfoModel(fsm, columns);

      fsm.focusCell({ rowId: 'row-1', field: 'data.name' });

      expect(model.formulaExpression).toBeUndefined();
    });

    it('returns expression for formula field', () => {
      const fsm = makeFSMWithNavigation(['data.total'], ['row-1']);
      const columnsModel = new ColumnsModel();
      columnsModel.init([
        {
          field: 'data.total',
          label: 'total',
          fieldType: FilterFieldType.Number,
          isSystem: false,
          isDeprecated: false,
          hasFormula: true,
          formulaExpression: 'price * quantity',
          isSortable: false,
        },
      ]);
      columnsModel.reorderColumns(['data.total']);
      const model = new CellInfoModel(fsm, columnsModel);

      fsm.focusCell({ rowId: 'row-1', field: 'data.total' });

      expect(model.formulaExpression).toBe('price * quantity');
    });
  });
});
