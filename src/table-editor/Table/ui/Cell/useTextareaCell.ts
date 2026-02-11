import { type RefObject, useCallback, useRef, useState } from 'react';
import type { CellVM } from '../../model/CellVM.js';
import { type CellPosition, getClickOffset } from './cellEditorUtils.js';

interface TextareaCellState {
  cellRef: RefObject<HTMLDivElement | null>;
  textRef: RefObject<HTMLParagraphElement | null>;
  editPosition: CellPosition | null;
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
  const [editPosition, setEditPosition] = useState<CellPosition | null>(null);
  const [clickOffsetValue, setClickOffsetValue] = useState<
    number | undefined
  >();
  const [appendCharValue, setAppendCharValue] = useState<string | undefined>();

  const computePosition = useCallback(() => {
    if (cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect();
      setEditPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  const startEditing = useCallback(
    (clientX?: number) => {
      if (!cell.isEditable) {
        return;
      }
      computePosition();
      if (clientX !== undefined) {
        setClickOffsetValue(
          getClickOffset(textRef.current, cell.displayValue, clientX),
        );
      } else {
        setClickOffsetValue(undefined);
      }
      setAppendCharValue(undefined);
      cell.startEdit();
    },
    [cell, computePosition],
  );

  const handleTypeChar = useCallback(
    (char: string) => {
      if (!cell.isEditable) {
        return;
      }
      computePosition();
      setClickOffsetValue(undefined);
      setAppendCharValue(char);
      cell.startEdit();
    },
    [cell, computePosition],
  );

  const handleCommitted = useCallback(() => {
    setEditPosition(null);
  }, []);

  const handleCancel = useCallback(() => {
    cell.cancelEdit();
    setEditPosition(null);
  }, [cell]);

  const handleStartEditFromKeyboard = useCallback(() => {
    startEditing();
  }, [startEditing]);

  return {
    cellRef,
    textRef,
    editPosition,
    clickOffsetValue,
    appendCharValue,
    startEditing,
    handleTypeChar,
    handleCommitted,
    handleCancel,
    handleStartEditFromKeyboard,
  };
}
