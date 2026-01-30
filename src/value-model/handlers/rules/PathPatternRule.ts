import type { SchemaDefinition } from '../../core/types';
import type { ChangeHandlerRule } from '../types';

export class PathPatternRule implements ChangeHandlerRule {
  private readonly pattern: RegExp;

  constructor(pattern: string | RegExp) {
    this.pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  }

  matches(_schema: SchemaDefinition): boolean {
    return true;
  }

  matchesPath(path: string): boolean {
    return this.pattern.test(path);
  }
}
