import type { SelectionEdges } from '../../model/CellFSM.js';
import { SELECTION_BORDER_COLOR, type CellState } from './cellStyles.js';

const CLS = 'cw';
const CLS_DISPLAY = `${CLS} cw-display`;
const CLS_READONLY = `${CLS} cw-readonly`;
const CLS_FOCUSED = `${CLS} cw-focused`;
const CLS_EDITING = `${CLS} cw-editing`;
const CLS_READONLY_FOCUSED = `${CLS} cw-readonlyFocused`;
const CLS_SELECTED = `${CLS} cw-selected`;

export const CLS_ANCHOR = 'cw-anchor';

export const STATE_CLASS: Record<CellState, string> = {
  display: CLS_DISPLAY,
  readonly: CLS_READONLY,
  focused: CLS_FOCUSED,
  editing: CLS_EDITING,
  readonlyFocused: CLS_READONLY_FOCUSED,
  selected: CLS_SELECTED,
};

const CELL_STYLE_ID = 'cell-wrapper-styles';

export function ensureCellStyles(): void {
  if (typeof document === 'undefined') {
    return;
  }
  if (document.getElementById(CELL_STYLE_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = CELL_STYLE_ID;
  style.textContent = [
    '.cw{height:40px;padding:0 8px;position:relative;overflow:hidden;cursor:cell;box-shadow:var(--cw-shadow,none)}',
    '.cw:focus,.cw:focus-visible{outline:none;box-shadow:var(--cw-shadow,none)}',
    '.cw-display:hover,.cw-readonly:hover{background-color:var(--chakra-colors-gray-50);box-shadow:inset 0 -1px 0 0 #ededed}',
    '.cw-focused{background-color:var(--chakra-colors-blue-50)}',
    '.cw-focused::before,.cw-editing::before,.cw-readonlyFocused::before,.cw-anchor::before{content:"";position:absolute;inset:1px;border-radius:1px;pointer-events:none}',
    '.cw-focused::before{border:2px solid var(--chakra-colors-blue-400)}',
    '.cw-editing{cursor:text;background-color:white;z-index:1}',
    '.cw-editing::before{border:2px solid var(--chakra-colors-blue-500)}',
    '.cw-readonlyFocused{background-color:var(--chakra-colors-gray-50)}',
    '.cw-readonlyFocused::before{border:2px solid var(--chakra-colors-gray-400)}',
    '.cw-selected{background-color:var(--chakra-colors-blue-100);user-select:none}',
    '.cw-anchor::before{border:2px solid var(--chakra-colors-blue-400)}',
  ].join('');
  document.head.appendChild(style);
}

export const INNER_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '100%',
  width: '100%',
  minWidth: 0,
  overflow: 'hidden',
};

export function buildSelectionBoxShadow(edges: SelectionEdges): string | null {
  const shadows: string[] = [];
  if (edges.top) {
    shadows.push(`inset 0 2px 0 0 ${SELECTION_BORDER_COLOR}`);
  }
  if (edges.bottom) {
    shadows.push(`inset 0 -2px 0 0 ${SELECTION_BORDER_COLOR}`);
  }
  if (edges.left) {
    shadows.push(`inset 2px 0 0 0 ${SELECTION_BORDER_COLOR}`);
  }
  if (edges.right) {
    shadows.push(`inset -2px 0 0 0 ${SELECTION_BORDER_COLOR}`);
  }
  return shadows.length > 0 ? shadows.join(', ') : null;
}
