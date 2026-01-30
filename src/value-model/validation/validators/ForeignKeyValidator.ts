import type { Diagnostic } from '../../core/types';
import type { Validator, ValidationContext } from '../types';

export class ForeignKeyValidator implements Validator {
  readonly type = 'foreignKey';

  validate(context: ValidationContext): Diagnostic | null {
    const { value, schema, nodeName } = context;
    const foreignKey = schema.foreignKey;

    if (!foreignKey) {
      return null;
    }

    if (value === '' || value === null || value === undefined) {
      return {
        severity: 'error',
        type: this.type,
        message: `Reference to ${foreignKey} is required`,
        path: nodeName,
        params: { table: foreignKey },
      };
    }

    return null;
  }
}
