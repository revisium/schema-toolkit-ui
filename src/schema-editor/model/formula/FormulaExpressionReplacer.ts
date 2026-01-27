export class FormulaExpressionReplacer {
  public replacePathInExpression(
    expression: string,
    oldPath: string,
    newPath: string,
  ): string {
    const escapedOldPath = oldPath.replaceAll(
      /[.*+?^${}()|[\]\\]/g,
      String.raw`\$&`,
    );
    const regex = new RegExp(
      `(?<![a-zA-Z0-9_])${escapedOldPath}(?![a-zA-Z0-9_])`,
      'g',
    );
    return expression.replace(regex, newPath);
  }

  public replaceNameInPath(
    path: string,
    oldName: string,
    newName: string,
  ): string {
    if (path.startsWith('/')) {
      return this.replaceNameInAbsolutePath(path, oldName, newName);
    }

    if (path.startsWith('../') || path.startsWith('./')) {
      return this.replaceNameInRelativePath(path, oldName, newName);
    }

    return this.replaceNameInSimplePath(path, oldName, newName);
  }

  private replaceNameInAbsolutePath(
    path: string,
    oldName: string,
    newName: string,
  ): string {
    const parts = path.slice(1).split('.');
    const newParts = this.replaceNameInParts(parts, oldName, newName);
    return '/' + newParts.join('.');
  }

  private replaceNameInRelativePath(
    path: string,
    oldName: string,
    newName: string,
  ): string {
    const prefixMatch = /^((?:\.\.\/)+|\.\/)?(.*)$/.exec(path);
    if (!prefixMatch) {
      return path;
    }

    const prefix = prefixMatch[1] || '';
    const rest = prefixMatch[2] || '';

    if (rest === oldName) {
      return prefix + newName;
    }

    const parts = rest.split('.');
    const newParts = this.replaceNameInParts(parts, oldName, newName);
    return prefix + newParts.join('.');
  }

  private replaceNameInSimplePath(
    path: string,
    oldName: string,
    newName: string,
  ): string {
    if (path === oldName) {
      return newName;
    }

    const parts = path.split('.');
    const newParts = this.replaceNameInParts(parts, oldName, newName);
    return newParts.join('.');
  }

  private replaceNameInParts(
    parts: string[],
    oldName: string,
    newName: string,
  ): string[] {
    return parts.map((p) => (p === oldName ? newName : p));
  }
}
