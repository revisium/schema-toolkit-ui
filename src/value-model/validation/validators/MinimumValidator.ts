import type { ValidationContext } from '../types';
import { BaseNumberBoundValidator } from './BaseNumberBoundValidator';

export class MinimumValidator extends BaseNumberBoundValidator {
  readonly type = 'min';

  protected getBound(schema: ValidationContext['schema']): number | undefined {
    return schema.minimum;
  }

  protected checkViolation(value: number, bound: number): boolean {
    return value < bound;
  }

  protected getMessage(bound: number): string {
    return `Value must be at least ${bound}`;
  }

  protected getParams(bound: number, actual: number): Record<string, unknown> {
    return { min: bound, actual };
  }
}
