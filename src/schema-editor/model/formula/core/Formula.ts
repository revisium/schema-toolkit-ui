import type { ASTNode } from '@revisium/formula';
import type { FormulaDependency } from './FormulaDependency';

export interface Formula {
  version(): number;
  ast(): ASTNode;
  dependencies(): readonly FormulaDependency[];
  getNodeIdForAstPath(astPath: string): string | null;
}
