import type { SchemaDefinition } from '../../core/types';
import type { ChangeHandlerRule } from '../types';

export class AnyRule implements ChangeHandlerRule {
  matches(_schema: SchemaDefinition): boolean {
    return true;
  }
}
