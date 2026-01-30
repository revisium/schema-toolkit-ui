import type { Diagnostic } from '../../core/types';
import type { Validator, ValidationContext } from '../types';

export class EnumValidator implements Validator {
  readonly type = 'enum';

  validate(context: ValidationContext): Diagnostic | null {
    const { value, schema, nodeName } = context;
    const enumValues = schema.enum;

    if (!enumValues || enumValues.length === 0) {
      return null;
    }

    if (!enumValues.includes(value)) {
      return {
        severity: 'error',
        type: this.type,
        message: 'Value is not in allowed list',
        path: nodeName,
        params: { allowed: enumValues, actual: value },
      };
    }

    return null;
  }
}
