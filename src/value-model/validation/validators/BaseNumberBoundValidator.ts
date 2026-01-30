import type { Diagnostic } from '../../core/types';
import type { Validator, ValidationContext } from '../types';

export abstract class BaseNumberBoundValidator implements Validator {
  abstract readonly type: string;

  protected abstract getBound(
    schema: ValidationContext['schema'],
  ): number | undefined;
  protected abstract checkViolation(value: number, bound: number): boolean;
  protected abstract getMessage(bound: number): string;
  protected abstract getParams(
    bound: number,
    actual: number,
  ): Record<string, unknown>;

  validate(context: ValidationContext): Diagnostic | null {
    const { value, schema, nodeName } = context;
    const bound = this.getBound(schema);

    if (bound === undefined) {
      return null;
    }

    if (typeof value !== 'number') {
      return null;
    }

    if (this.checkViolation(value, bound)) {
      return {
        severity: 'error',
        type: this.type,
        message: this.getMessage(bound),
        path: nodeName,
        params: this.getParams(bound, value),
      };
    }

    return null;
  }
}
