import type { ValidationContext } from '../types';
import { BaseStringLengthValidator } from './BaseStringLengthValidator';

export class MinLengthValidator extends BaseStringLengthValidator {
  readonly type = 'minLength';

  protected getLimit(schema: ValidationContext['schema']): number | undefined {
    return schema.minLength;
  }

  protected checkViolation(length: number, limit: number): boolean {
    return length < limit;
  }

  protected getMessage(limit: number): string {
    return `Minimum length is ${limit}`;
  }

  protected getParams(limit: number, actual: number): Record<string, unknown> {
    return { min: limit, actual };
  }
}
