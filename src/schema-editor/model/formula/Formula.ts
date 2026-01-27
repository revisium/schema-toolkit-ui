import type { ASTNode } from '@revisium/formula';
import type { FormulaDependency } from './FormulaDependency';

export interface Formula {
  version(): number;
  expression(): string;
  ast(): ASTNode;
  dependencies(): readonly FormulaDependency[];
}
