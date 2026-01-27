import { JsonPointerPath } from '../path/JsonPointerPath';

export class PatchPathUtils {
  public getFieldNameFromPath(path: string): string {
    try {
      const parsed = new JsonPointerPath(path);
      return parsed.asSimple();
    } catch {
      return '';
    }
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
