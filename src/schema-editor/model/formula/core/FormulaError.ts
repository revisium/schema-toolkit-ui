export class FormulaError extends Error {
  constructor(
    message: string,
    private readonly nodeId: string,
    private readonly details?: string,
  ) {
    super(message);
    this.name = 'FormulaError';
  }

  formulaNodeId(): string {
    return this.nodeId;
  }

  errorDetails(): string | undefined {
    return this.details;
  }
}
