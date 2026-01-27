export class PatchPathUtils {
  public getFieldNameFromPath(path: string): string {
    const parts = path.split('/').filter(Boolean);
    const segments: string[] = [];

    let i = 0;
    while (i < parts.length) {
      const part = parts[i];
      if (part === 'properties' && i + 1 < parts.length) {
        segments.push(parts[i + 1] ?? '');
        i += 2;
      } else if (part === 'items') {
        if (segments.length > 0) {
          segments[segments.length - 1] += '[*]';
        }
        i += 1;
      } else {
        i += 1;
      }
    }

    return segments.join('.');
  }

  public isRenameMove(fromPath: string, toPath: string): boolean {
    return this.getParentPath(fromPath) === this.getParentPath(toPath);
  }

  public movesIntoArrayBoundary(fromPath: string, toPath: string): boolean {
    return this.countArrayDepth(toPath) > this.countArrayDepth(fromPath);
  }

  private getParentPath(path: string): string {
    const parts = path.split('/').filter(Boolean);
    if (parts.length <= 2) {
      return '';
    }
    return '/' + parts.slice(0, -2).join('/');
  }

  private countArrayDepth(path: string): number {
    return (path.match(/\/items/g) || []).length;
  }
}
