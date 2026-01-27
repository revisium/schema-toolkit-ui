import type { SchemaNode } from '../node/SchemaNode';
import {
  isValidFieldName,
  FIELD_NAME_ERROR_MESSAGE,
} from './FieldNameValidator';

export type ValidationErrorType =
  | 'empty-name'
  | 'duplicate-name'
  | 'invalid-name';

export interface ValidationError {
  nodeId: string;
  type: ValidationErrorType;
  message: string;
}

export class SchemaValidator {
  validate(root: SchemaNode): ValidationError[] {
    const errors: ValidationError[] = [];
    this.collectValidationErrors(root, errors);
    return errors;
  }

  private collectValidationErrors(
    node: SchemaNode,
    errors: ValidationError[],
  ): void {
    if (node.isNull()) {
      return;
    }

    if (node.isObject()) {
      const children = node.children();
      const nameSet = new Set<string>();
      for (const child of children) {
        const name = child.name();
        if (!name) {
          errors.push({
            nodeId: child.id(),
            type: 'empty-name',
            message: 'Field name is required',
          });
        } else if (nameSet.has(name)) {
          errors.push({
            nodeId: child.id(),
            type: 'duplicate-name',
            message: `Duplicate field name: ${name}`,
          });
        } else if (!isValidFieldName(name)) {
          errors.push({
            nodeId: child.id(),
            type: 'invalid-name',
            message: FIELD_NAME_ERROR_MESSAGE,
          });
        }
        nameSet.add(name);
        this.collectValidationErrors(child, errors);
      }
    }

    if (node.isArray()) {
      const items = node.items();
      if (!items.isNull()) {
        this.collectValidationErrors(items, errors);
      }
    }
  }
}
