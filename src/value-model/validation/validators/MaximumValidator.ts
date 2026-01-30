import type { ValidationContext } from '../types';
import { BaseNumberBoundValidator } from './BaseNumberBoundValidator';

export class MaximumValidator extends BaseNumberBoundValidator {
  readonly type = 'max';

  protected getBound(schema: ValidationContext['schema']): number | undefined {
    return schema.maximum;
  }

  protected checkViolation(value: number, bound: number): boolean {
    return value > bound;
  }

  protected getMessage(bound: number): string {
    return `Value must be at most ${bound}`;
  }

  protected getParams(bound: number, actual: number): Record<string, unknown> {
    return { max: bound, actual };
  }
}
