export const CELL_HEIGHT = 40;
export const LINE_HEIGHT = 20;
export const VERTICAL_PADDING = (CELL_HEIGHT - LINE_HEIGHT) / 2;
const CARET_Y_OFFSET = VERTICAL_PADDING;

export interface CellPosition {
  top: number;
  left: number;
  width: number;
}

export function getClickOffset(
  textElement: HTMLElement | null,
  displayValue: string,
  clientX: number,
): number {
  if (!textElement || !displayValue) {
    return displayValue.length;
  }

  const textNode = textElement.firstChild;
  if (textNode?.nodeType !== Node.TEXT_NODE) {
    return displayValue.length;
  }

  const y = textElement.getBoundingClientRect().top + CARET_Y_OFFSET;

  if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(clientX, y);
    if (pos?.offsetNode === textNode) {
      return pos.offset;
    }
  }

  const rect = textElement.getBoundingClientRect();
  const clickX = clientX - rect.left;
  const textWidth = textElement.scrollWidth;
  const charWidth = textWidth / displayValue.length;
  return Math.max(
    0,
    Math.min(displayValue.length, Math.round(clickX / charWidth)),
  );
}

export function resolveCursorPosition(
  appendChar: string | undefined,
  appendLength: number,
  clickOffset: number | undefined,
  valueLength: number,
): number {
  if (appendChar !== undefined) {
    return appendLength;
  }
  if (clickOffset !== undefined) {
    return Math.min(clickOffset, valueLength);
  }
  return valueLength;
}
