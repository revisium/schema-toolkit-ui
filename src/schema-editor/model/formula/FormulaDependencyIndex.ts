import { makeAutoObservable, observable } from 'mobx';
import type { Formula } from './Formula';

export interface FormulaDependent {
  formulaNodeId: string;
  fieldName: string;
  expression: string;
}

export class FormulaDependencyIndex {
  private readonly dependentsMap = observable.map<string, Set<string>>();
  private readonly formulasByNodeId = observable.map<string, Formula>();

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  registerFormula(
    formulaNodeId: string,
    _fieldName: string,
    formula: Formula,
  ): void {
    this.unregisterFormula(formulaNodeId);

    this.formulasByNodeId.set(formulaNodeId, formula);

    for (const dep of formula.dependencies()) {
      const targetId = dep.targetNodeId();
      let dependents = this.dependentsMap.get(targetId);
      if (!dependents) {
        dependents = observable.set<string>();
        this.dependentsMap.set(targetId, dependents);
      }
      dependents.add(formulaNodeId);
    }
  }

  unregisterFormula(formulaNodeId: string): void {
    this.formulasByNodeId.delete(formulaNodeId);

    for (const [targetId, dependents] of this.dependentsMap) {
      dependents.delete(formulaNodeId);
      if (dependents.size === 0) {
        this.dependentsMap.delete(targetId);
      }
    }
  }

  getDependents(nodeId: string): readonly string[] {
    const dependents = this.dependentsMap.get(nodeId);
    return dependents ? Array.from(dependents) : [];
  }

  hasDependents(nodeId: string): boolean {
    const dependents = this.dependentsMap.get(nodeId);
    return dependents !== undefined && dependents.size > 0;
  }

  getFormula(nodeId: string): Formula | null {
    return this.formulasByNodeId.get(nodeId) ?? null;
  }

  updateFormulaExpression(
    formulaNodeId: string,
    fieldName: string,
    newExpression: string,
    createFormula: (expression: string) => Formula,
  ): void {
    const newFormula = createFormula(newExpression);
    this.registerFormula(formulaNodeId, fieldName, newFormula);
  }

  clear(): void {
    this.dependentsMap.clear();
    this.formulasByNodeId.clear();
  }
}
