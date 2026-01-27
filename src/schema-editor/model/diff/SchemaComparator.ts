export class SchemaComparator {
  public areEqual(a: unknown, b: unknown): boolean {
    if (a === b) {
      return true;
    }

    if (
      a === null ||
      b === null ||
      typeof a !== 'object' ||
      typeof b !== 'object'
    ) {
      return a === b;
    }

    if (Array.isArray(a) !== Array.isArray(b)) {
      return false;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      return this.arraysEqual(a, b);
    }

    return this.objectsEqual(
      a as Record<string, unknown>,
      b as Record<string, unknown>,
    );
  }

  private arraysEqual(a: unknown[], b: unknown[]): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((item, i) => this.areEqual(item, b[i]));
  }

  private objectsEqual(
    a: Record<string, unknown>,
    b: Record<string, unknown>,
  ): boolean {
    const aKeys = Object.keys(a).sort((x, y) => x.localeCompare(y));
    const bKeys = Object.keys(b).sort((x, y) => x.localeCompare(y));

    if (aKeys.length !== bKeys.length) {
      return false;
    }

    if (!aKeys.every((k, i) => k === bKeys[i])) {
      return false;
    }

    return aKeys.every((key) => this.areEqual(a[key], b[key]));
  }
}
