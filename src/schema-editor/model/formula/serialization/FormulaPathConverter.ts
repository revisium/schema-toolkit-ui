import type { Path } from '../../path';
import { RelativePathBuilder } from './RelativePathBuilder';

export class FormulaPathConverter {
  private readonly relativePathBuilder = new RelativePathBuilder();

  public pathToAbsolute(path: Path): string {
    const segments = path.segments();
    const parts: string[] = [];

    for (const seg of segments) {
      if (seg.isProperty()) {
        parts.push(seg.propertyName());
      } else if (seg.isItems() && parts.length > 0) {
        parts[parts.length - 1] += '[*]';
      }
    }

    return '/' + parts.join('.');
  }

  public computeRelativePath(fromPath: Path, toPath: Path): string | null {
    return this.relativePathBuilder.build(fromPath, toPath);
  }

  public isComplexRelativePath(path: string): boolean {
    const match = /^(\.\.\/)+/.exec(path);
    if (!match) {
      return false;
    }
    const parentTraversalLength = 3;
    const upCount = match[0].length / parentTraversalLength;
    return upCount > 1;
  }

  public isSimpleName(path: string): boolean {
    return !path.includes('/') && !path.includes('.');
  }

  public isAbsolutePath(path: string): boolean {
    return path.startsWith('/');
  }
}
