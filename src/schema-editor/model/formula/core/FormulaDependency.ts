export interface FormulaDependency {
  targetNodeId(): string;
}

export class ResolvedDependency implements FormulaDependency {
  constructor(private readonly nodeId: string) {
    if (!nodeId) {
      throw new Error('FormulaDependency requires targetNodeId');
    }
  }

  targetNodeId(): string {
    return this.nodeId;
  }
}
