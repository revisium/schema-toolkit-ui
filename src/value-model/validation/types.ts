import type { Diagnostic, SchemaDefinition } from '../core/types';

export interface ValidationContext {
  readonly value: unknown;
  readonly schema: SchemaDefinition;
  readonly nodeName: string;
}

export interface Validator {
  readonly type: string;
  validate(context: ValidationContext): Diagnostic | null;
}

export interface ValidatorRule {
  shouldApply(context: ValidationContext): boolean;
  readonly validatorType: string;
}

export type ValidatorFactoryFn = () => Validator;
