import { createContext } from 'react';

export interface CellContextActions {
  copyRange: () => void;
  pasteRange: () => void;
  clearRange: () => void;
}

export const CellContextActionsContext =
  createContext<CellContextActions | null>(null);
