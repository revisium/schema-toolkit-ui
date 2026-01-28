export type ValidationErrorType =
  | 'empty-name'
  | 'duplicate-name'
  | 'invalid-name';

export interface SchemaValidationError {
  nodeId: string;
  type: ValidationErrorType;
  message: string;
}

export interface FormulaError {
  message: string;
  fieldPath?: string;
}
