import { type RefObject, useCallback, useRef } from 'react';
import type { CellVM } from '../../model/CellVM.js';
import { type CellPosition, getClickOffset } from './cellEditorUtils.js';

interface TextareaCellState {
  cellRef: RefObject<HTMLDivElement | null>;
  textRef: RefObject<HTMLParagraphElement | null>;
  getEditPosition: () => CellPosition | null;
  clickOffsetValue: number | undefined;
  appendCharValue: string | undefined;
  startEditing: (clientX?: number) => void;
  handleTypeChar: (char: string) => void;
  handleCommitted: () => void;
  handleCancel: () => void;
  handleStartEditFromKeyboard: () => void;
}

export function useTextareaCell(cell: CellVM): TextareaCellState {
  const cellRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  const getEditPosition = useCallback((): CellPosition | null => {
    if (!cellRef.current) {
      return null;
    }
    const rect = cellRef.current.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
    };
  }, []);

  const trigger = cell.editTrigger;
  const clickOffsetValue =
    trigger?.type === 'doubleClick' ? trigger.clickOffset : undefined;
  const appendCharValue = trigger?.type === 'char' ? trigger.char : undefined;

  const startEditing = useCallback(
    (clientX?: number) => {
      if (!cell.isEditable) {
        return;
      }
      const offset =
        clientX !== undefined
          ? getClickOffset(textRef.current, cell.displayValue, clientX)
          : undefined;
      cell.startEditWithDoubleClick(offset);
    },
    [cell],
  );

  const handleTypeChar = useCallback(
    (char: string) => {
      if (!cell.isEditable) {
        return;
      }
      cell.startEditWithChar(char);
    },
    [cell],
  );

  const handleCommitted = useCallback(() => {}, []);

  const handleCancel = useCallback(() => {
    cell.cancelEdit();
  }, [cell]);

  const handleStartEditFromKeyboard = useCallback(() => {
    if (!cell.isEditable) {
      return;
    }
    cell.startEdit();
  }, [cell]);

  return {
    cellRef,
    textRef,
    getEditPosition,
    clickOffsetValue,
    appendCharValue,
    startEditing,
    handleTypeChar,
    handleCommitted,
    handleCancel,
    handleStartEditFromKeyboard,
  };
}
