import type { ValidationContext } from '../types';
import { BaseStringLengthValidator } from './BaseStringLengthValidator';

export class MaxLengthValidator extends BaseStringLengthValidator {
  readonly type = 'maxLength';

  protected getLimit(schema: ValidationContext['schema']): number | undefined {
    return schema.maxLength;
  }

  protected checkViolation(length: number, limit: number): boolean {
    return length > limit;
  }

  protected getMessage(limit: number): string {
    return `Maximum length is ${limit}`;
  }

  protected getParams(limit: number, actual: number): Record<string, unknown> {
    return { max: limit, actual };
  }
}
