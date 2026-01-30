import type { Diagnostic } from '../../core/types';
import type { Validator, ValidationContext } from '../types';

export abstract class BaseStringLengthValidator implements Validator {
  abstract readonly type: string;

  protected abstract getLimit(
    schema: ValidationContext['schema'],
  ): number | undefined;
  protected abstract checkViolation(length: number, limit: number): boolean;
  protected abstract getMessage(limit: number): string;
  protected abstract getParams(
    limit: number,
    actual: number,
  ): Record<string, unknown>;

  validate(context: ValidationContext): Diagnostic | null {
    const { value, schema, nodeName } = context;
    const limit = this.getLimit(schema);

    if (limit === undefined) {
      return null;
    }

    if (typeof value !== 'string') {
      return null;
    }

    if (value.length === 0) {
      return null;
    }

    if (this.checkViolation(value.length, limit)) {
      return {
        severity: 'error',
        type: this.type,
        message: this.getMessage(limit),
        path: nodeName,
        params: this.getParams(limit, value.length),
      };
    }

    return null;
  }
}
