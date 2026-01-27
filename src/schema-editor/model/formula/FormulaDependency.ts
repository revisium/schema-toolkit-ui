export interface FormulaDependency {
  originalPath(): string;
  targetNodeId(): string;
}

export class ResolvedDependency implements FormulaDependency {
  constructor(
    private readonly path: string,
    private readonly nodeId: string,
  ) {
    if (!path) {
      throw new Error('FormulaDependency requires originalPath');
    }
    if (!nodeId) {
      throw new Error('FormulaDependency requires targetNodeId');
    }
  }

  originalPath(): string {
    return this.path;
  }

  targetNodeId(): string {
    return this.nodeId;
  }
}
