import type {
  ObservableFSMConfig,
  TransitionFn,
} from '../../../lib/fsm/index.js';

export interface CellAddress {
  rowId: string;
  field: string;
}

export type EditTrigger =
  | { type: 'doubleClick'; clickOffset?: number }
  | { type: 'enter' }
  | { type: 'char'; char: string };

export interface SelectedRange {
  startCol: number;
  endCol: number;
  startRow: number;
  endRow: number;
}

export interface SelectionEdges {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}

export type CellState = 'idle' | 'focused' | 'editing';

export type CellEvent =
  | 'FOCUS'
  | 'BLUR'
  | 'DOUBLE_CLICK'
  | 'ENTER'
  | 'TYPE_CHAR'
  | 'COMMIT'
  | 'COMMIT_MOVE_DOWN'
  | 'CANCEL'
  | 'MOVE_UP'
  | 'MOVE_DOWN'
  | 'MOVE_LEFT'
  | 'MOVE_RIGHT'
  | 'TAB'
  | 'SELECT_TO'
  | 'SHIFT_MOVE_UP'
  | 'SHIFT_MOVE_DOWN'
  | 'SHIFT_MOVE_LEFT'
  | 'SHIFT_MOVE_RIGHT'
  | 'DRAG_START'
  | 'DRAG_EXTEND';

export interface CellFSMContext {
  focusedCell: CellAddress | null;
  anchorCell: CellAddress | null;
  editTrigger: EditTrigger | null;
  columns: string[];
  rowIds: string[];
  navigationVersion: number;
  _pendingCell: CellAddress | null;
  _pendingTrigger: EditTrigger | null;
  _pendingShift: boolean;
}

function moveFocused(
  colDelta: number,
  rowDelta: number,
): TransitionFn<CellState, CellFSMContext> {
  return (ctx) => {
    const next = moveCell(ctx, colDelta, rowDelta);
    if (next) {
      return {
        target: 'focused',
        context: { focusedCell: next, anchorCell: null },
      };
    }
    return { target: 'focused', context: { anchorCell: null } };
  };
}

function shiftMoveFocused(
  colDelta: number,
  rowDelta: number,
): TransitionFn<CellState, CellFSMContext> {
  return (ctx) => {
    const anchor = ctx.anchorCell ?? ctx.focusedCell;
    const next = moveCell(ctx, colDelta, rowDelta);
    if (next) {
      return {
        target: 'focused',
        context: { focusedCell: next, anchorCell: anchor },
      };
    }
    return { target: 'focused', context: { anchorCell: anchor } };
  };
}

function tabFocused(): TransitionFn<CellState, CellFSMContext> {
  return (ctx) => {
    const next = resolveTabTarget(ctx, ctx._pendingShift ? -1 : 1);
    if (next) {
      return {
        target: 'focused',
        context: { focusedCell: next, anchorCell: null },
      };
    }
    return { target: 'focused', context: { anchorCell: null } };
  };
}

function moveCell(
  ctx: CellFSMContext,
  colDelta: number,
  rowDelta: number,
): CellAddress | null {
  const pos = currentPosition(ctx);
  if (!pos) {
    return null;
  }
  return cellAt(ctx, pos.colIndex + colDelta, pos.rowIndex + rowDelta);
}

function resolveTabTarget(
  ctx: CellFSMContext,
  delta: number,
): CellAddress | null {
  const pos = currentPosition(ctx);
  if (!pos) {
    return null;
  }

  const nextCol = pos.colIndex + delta;
  const sameRow = cellAt(ctx, nextCol, pos.rowIndex);
  if (sameRow) {
    return sameRow;
  }

  const wrapCol = delta > 0 ? 0 : ctx.columns.length - 1;
  return cellAt(ctx, wrapCol, pos.rowIndex + delta);
}

function currentPosition(
  ctx: CellFSMContext,
): { colIndex: number; rowIndex: number } | null {
  if (!ctx.focusedCell) {
    return null;
  }
  const colIndex = ctx.columns.indexOf(ctx.focusedCell.field);
  const rowIndex = ctx.rowIds.indexOf(ctx.focusedCell.rowId);
  if (colIndex === -1 || rowIndex === -1) {
    return null;
  }
  return { colIndex, rowIndex };
}

function cellAt(
  ctx: CellFSMContext,
  colIndex: number,
  rowIndex: number,
): CellAddress | null {
  const field = ctx.columns[colIndex];
  const rowId = ctx.rowIds[rowIndex];
  if (field === undefined || rowId === undefined) {
    return null;
  }
  return { rowId, field };
}

export function cellPosition(
  ctx: CellFSMContext,
  cell: CellAddress,
): { colIndex: number; rowIndex: number } | null {
  const colIndex = ctx.columns.indexOf(cell.field);
  const rowIndex = ctx.rowIds.indexOf(cell.rowId);
  if (colIndex === -1 || rowIndex === -1) {
    return null;
  }
  return { colIndex, rowIndex };
}

export function createConfig(): ObservableFSMConfig<
  CellState,
  CellEvent,
  CellFSMContext
> {
  return {
    initial: 'idle',
    context: {
      focusedCell: null,
      anchorCell: null,
      editTrigger: null,
      columns: [],
      rowIds: [],
      navigationVersion: 0,
      _pendingCell: null,
      _pendingTrigger: null,
      _pendingShift: false,
    },
    transitions: {
      idle: {
        FOCUS: (ctx) => ({
          target: 'focused',
          context: {
            focusedCell: ctx._pendingCell,
            anchorCell: null,
            editTrigger: null,
          },
        }),
        DRAG_START: (ctx) => ({
          target: 'focused',
          context: {
            anchorCell: ctx._pendingCell,
            focusedCell: ctx._pendingCell,
            editTrigger: null,
          },
        }),
      },
      focused: {
        FOCUS: (ctx) => ({
          target: 'focused',
          context: {
            focusedCell: ctx._pendingCell,
            anchorCell: null,
            editTrigger: null,
          },
        }),
        BLUR: {
          target: 'idle',
          action: (ctx) => {
            ctx.focusedCell = null;
            ctx.anchorCell = null;
            ctx.editTrigger = null;
          },
        },
        DOUBLE_CLICK: (ctx) => ({
          target: 'editing',
          context: {
            anchorCell: null,
            editTrigger: ctx._pendingTrigger,
          },
        }),
        ENTER: {
          target: 'editing',
          action: (ctx) => {
            ctx.anchorCell = null;
            ctx.editTrigger = { type: 'enter' };
          },
        },
        TYPE_CHAR: (ctx) => ({
          target: 'editing',
          context: {
            anchorCell: null,
            editTrigger: ctx._pendingTrigger,
          },
        }),
        MOVE_UP: moveFocused(0, -1),
        MOVE_DOWN: moveFocused(0, 1),
        MOVE_LEFT: moveFocused(-1, 0),
        MOVE_RIGHT: moveFocused(1, 0),
        TAB: tabFocused(),
        SELECT_TO: (ctx) => ({
          target: 'focused',
          context: {
            anchorCell: ctx.anchorCell ?? ctx.focusedCell,
            focusedCell: ctx._pendingCell,
          },
        }),
        SHIFT_MOVE_UP: shiftMoveFocused(0, -1),
        SHIFT_MOVE_DOWN: shiftMoveFocused(0, 1),
        SHIFT_MOVE_LEFT: shiftMoveFocused(-1, 0),
        SHIFT_MOVE_RIGHT: shiftMoveFocused(1, 0),
        DRAG_START: (ctx) => ({
          target: 'focused',
          context: {
            anchorCell: ctx._pendingCell,
            focusedCell: ctx._pendingCell,
          },
        }),
        DRAG_EXTEND: (ctx) => ({
          target: 'focused',
          context: {
            focusedCell: ctx._pendingCell,
          },
        }),
      },
      editing: {
        FOCUS: (ctx) => ({
          target: 'focused',
          context: {
            focusedCell: ctx._pendingCell,
            anchorCell: null,
            editTrigger: null,
          },
        }),
        DRAG_START: (ctx) => ({
          target: 'focused',
          context: {
            anchorCell: ctx._pendingCell,
            focusedCell: ctx._pendingCell,
            editTrigger: null,
          },
        }),
        COMMIT: {
          target: 'focused',
          action: (ctx) => {
            ctx.anchorCell = null;
            ctx.editTrigger = null;
          },
        },
        COMMIT_MOVE_DOWN: (ctx) => {
          const next = moveCell(ctx, 0, 1);
          if (next) {
            return {
              target: 'editing',
              context: {
                focusedCell: next,
                anchorCell: null,
                editTrigger: { type: 'enter' as const },
              },
            };
          }
          return {
            target: 'focused',
            context: {
              anchorCell: null,
              editTrigger: null,
            },
          };
        },
        CANCEL: {
          target: 'focused',
          action: (ctx) => {
            ctx.anchorCell = null;
            ctx.editTrigger = null;
          },
        },
        BLUR: {
          target: 'idle',
          action: (ctx) => {
            ctx.focusedCell = null;
            ctx.anchorCell = null;
            ctx.editTrigger = null;
          },
        },
      },
    },
  };
}
