import type { Path } from './Path';
import type { PathSegment } from './PathSegment';
import { PropertySegment, ITEMS_SEGMENT } from './PathSegment';
import { EMPTY_PATH, PathFromSegments } from './Paths';

export interface ArrayNotationResult {
  name: string;
  hasArray: boolean;
}

export class PathUtils {
  private static readonly ARRAY_NOTATION_REGEX = /^([^[]+)\[(?:\d+|\*)?\]$/;

  static parseArrayNotation(part: string): ArrayNotationResult {
    const match = PathUtils.ARRAY_NOTATION_REGEX.exec(part);
    if (match?.[1]) {
      return { name: match[1], hasArray: true };
    }
    return { name: part, hasArray: false };
  }

  static jsonPointerToSegments(pointer: string): PathSegment[] {
    if (pointer === '' || pointer === '/') {
      return [];
    }

    const parts = pointer.split('/').filter(Boolean);
    const segments: PathSegment[] = [];

    let i = 0;
    while (i < parts.length) {
      const part = parts[i];
      if (part === 'properties' && i + 1 < parts.length) {
        const name = parts[i + 1];
        if (name !== undefined) {
          segments.push(new PropertySegment(name));
        }
        i += 2;
      } else if (part === 'items') {
        segments.push(ITEMS_SEGMENT);
        i += 1;
      } else {
        throw new Error(`Invalid path segment: ${part} in path ${pointer}`);
      }
    }

    return segments;
  }

  static segmentsToJsonPointer(segments: readonly PathSegment[]): string {
    return segments
      .map((seg) =>
        seg.isProperty() ? `/properties/${seg.propertyName()}` : '/items',
      )
      .join('');
  }

  static jsonPointerToPath(pointer: string): Path {
    const segments = PathUtils.jsonPointerToSegments(pointer);
    return segments.length === 0 ? EMPTY_PATH : new PathFromSegments(segments);
  }

  static simplePathToSegments(simplePath: string): PathSegment[] {
    if (!simplePath) {
      return [];
    }

    const parts = simplePath.split('.');
    const segments: PathSegment[] = [];

    for (const part of parts) {
      if (!part) {
        throw new Error(
          `Invalid simple path: empty segment in "${simplePath}"`,
        );
      }

      const { name, hasArray } = PathUtils.parseArrayNotation(part);
      segments.push(new PropertySegment(name));
      if (hasArray) {
        segments.push(ITEMS_SEGMENT);
      }
    }

    return segments;
  }

  static simplePathToPath(simplePath: string): Path {
    const segments = PathUtils.simplePathToSegments(simplePath);
    return segments.length === 0 ? EMPTY_PATH : new PathFromSegments(segments);
  }

  static isChildOf(parent: Path, child: Path): boolean {
    if (parent.isEmpty()) {
      return !child.isEmpty();
    }

    const parentSegs = parent.segments();
    const childSegs = child.segments();

    if (childSegs.length <= parentSegs.length) {
      return false;
    }

    for (let i = 0; i < parentSegs.length; i++) {
      const parentSeg = parentSegs[i];
      const childSeg = childSegs[i];
      if (!parentSeg || !childSeg || !parentSeg.equals(childSeg)) {
        return false;
      }
    }

    return true;
  }

  static isChildOfJsonPointer(
    parentPointer: string,
    childPointer: string,
  ): boolean {
    if (parentPointer === '') {
      return childPointer !== '' && childPointer !== '/';
    }
    return childPointer.startsWith(parentPointer + '/');
  }

  static getTopLevelPath(path: Path): Path | null {
    const segments = path.segments();
    if (segments.length === 0) {
      return null;
    }

    const firstSeg = segments[0];
    if (!firstSeg?.isProperty()) {
      return null;
    }

    return new PathFromSegments([firstSeg]);
  }

  static getTopLevelJsonPointer(pointer: string): string | null {
    const parts = pointer.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[0] === 'properties') {
      return `/properties/${parts[1]}`;
    }
    return null;
  }

  static isTopLevelProperty(path: Path): boolean {
    const segments = path.segments();
    return segments.length === 1 && segments[0]?.isProperty() === true;
  }

  static isTopLevelJsonPointer(pointer: string): boolean {
    const parts = pointer.split('/').filter(Boolean);
    return parts.length === 2 && parts[0] === 'properties';
  }

  static getParentJsonPointer(pointer: string): string {
    const parts = pointer.split('/').filter(Boolean);
    if (parts.length <= 2) {
      return '';
    }
    return '/' + parts.slice(0, -2).join('/');
  }

  static countArrayDepth(path: Path): number {
    return path.segments().filter((seg) => seg.isItems()).length;
  }

  static countArrayDepthFromJsonPointer(pointer: string): number {
    return (pointer.match(/\/items/g) || []).length;
  }

  static getFieldNameFromPath(path: Path): string {
    const segments = path.segments();
    const parts: string[] = [];

    for (const seg of segments) {
      if (seg.isProperty()) {
        parts.push(seg.propertyName());
      } else if (seg.isItems() && parts.length > 0) {
        parts[parts.length - 1] += '[*]';
      }
    }

    return parts.join('.');
  }

  static buildChildPath(parentPath: Path, childName: string): Path {
    return parentPath.child(childName);
  }

  static buildChildJsonPointer(
    parentPointer: string,
    childName: string,
  ): string {
    return parentPointer
      ? `${parentPointer}/properties/${childName}`
      : `/properties/${childName}`;
  }
}
