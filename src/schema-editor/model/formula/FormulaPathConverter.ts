import type { Path } from '../path/Path';
import type { PathSegment } from '../path/PathSegment';

export class FormulaPathConverter {
  public pathToAbsolute(path: Path): string {
    const segments = path.segments();
    const parts: string[] = [];

    for (const seg of segments) {
      if (seg.isProperty()) {
        parts.push(seg.propertyName());
      } else if (seg.isItems()) {
        parts[parts.length - 1] += '[*]';
      }
    }

    return '/' + parts.join('.');
  }

  public computeRelativePath(fromPath: Path, toPath: Path): string | null {
    const fromSegments = fromPath.parent().segments();
    const toSegments = toPath.segments();

    const commonPrefixLen = this.findCommonPrefixLength(
      fromSegments,
      toSegments,
    );
    const upCount = fromSegments.length - commonPrefixLen;
    const downParts = this.extractPropertyNames(toSegments, commonPrefixLen);

    return this.buildRelativePathString(upCount, downParts);
  }

  public isComplexRelativePath(path: string): boolean {
    const match = path.match(/^(\.\.\/)+/);
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

  private findCommonPrefixLength(
    fromSegments: readonly PathSegment[],
    toSegments: readonly PathSegment[],
  ): number {
    const minLen = Math.min(fromSegments.length, toSegments.length);
    let commonPrefixLen = 0;

    for (let i = 0; i < minLen; i++) {
      const fromSeg = fromSegments[i];
      const toSeg = toSegments[i];

      if (this.areMatchingPropertySegments(fromSeg, toSeg)) {
        commonPrefixLen++;
      } else {
        break;
      }
    }

    return commonPrefixLen;
  }

  private areMatchingPropertySegments(
    fromSeg: PathSegment | undefined,
    toSeg: PathSegment | undefined,
  ): boolean {
    return (
      fromSeg !== undefined &&
      toSeg !== undefined &&
      fromSeg.isProperty() &&
      toSeg.isProperty() &&
      fromSeg.propertyName() === toSeg.propertyName()
    );
  }

  private extractPropertyNames(
    segments: readonly PathSegment[],
    startIndex: number,
  ): string[] {
    const parts: string[] = [];

    for (let i = startIndex; i < segments.length; i++) {
      const seg = segments[i];
      if (seg?.isProperty()) {
        parts.push(seg.propertyName());
      }
    }

    return parts;
  }

  private buildRelativePathString(
    upCount: number,
    downParts: string[],
  ): string | null {
    if (upCount === 0 && downParts.length > 0) {
      return downParts.join('.');
    }

    if (upCount > 0) {
      const ups = '../'.repeat(upCount);
      return ups + downParts.join('.');
    }

    return null;
  }
}
