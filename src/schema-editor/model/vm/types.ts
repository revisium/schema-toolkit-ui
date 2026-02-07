import type { JsonObjectSchema } from '@revisium/schema-toolkit';
import type { SchemaTreeVM } from './SchemaTreeVM';
import type { ReviewErrorsDialogVM } from '../dialog/ReviewErrorsDialogVM';
import type { ViewMode } from '../core';

export interface BaseEditorVM {
  readonly mode: 'creating' | 'updating';
  readonly tree: SchemaTreeVM;

  // Toolbar
  readonly loading: boolean;
  readonly viewMode: ViewMode;
  setViewMode(mode: ViewMode): void;
  cancel(): void;

  // Errors dialog
  readonly showReviewErrorsButton: boolean;
  readonly errorsCount: number;
  readonly isErrorsDialogOpen: boolean;
  openErrorsDialog(): void;
  closeErrorsDialog(): void;
  readonly errorsDialogVM: ReviewErrorsDialogVM;

  // View data
  getPlainSchema(): JsonObjectSchema;
}
