import type { Path } from './Path';
import type { PathSegment } from './PathSegment';
import { PropertySegment, ITEMS_SEGMENT } from './PathSegment';
import { ParsedPathBase } from './ParsedPathBase';

class EmptyPathImpl implements Path {
  segments(): readonly PathSegment[] {
    return [];
  }

  asJsonPointer(): string {
    return '';
  }

  asSimple(): string {
    return '';
  }

  parent(): Path {
    return this;
  }

  child(name: string): Path {
    return new SegmentPathImpl([new PropertySegment(name)]);
  }

  childItems(): Path {
    throw new Error('Cannot add items to empty path without property');
  }

  equals(other: Path): boolean {
    return other.isEmpty();
  }

  isEmpty(): boolean {
    return true;
  }

  length(): number {
    return 0;
  }

  lastSegment(): PathSegment | null {
    return null;
  }

  isChildOf(_parent: Path): boolean {
    return false;
  }

  getTopLevel(): Path | null {
    return null;
  }
}

class SegmentPathImpl implements Path {
  constructor(private readonly segs: readonly PathSegment[]) {
    if (segs.length === 0) {
      throw new Error('Use EMPTY_PATH for empty segments');
    }
  }

  segments(): readonly PathSegment[] {
    return this.segs;
  }

  asJsonPointer(): string {
    return this.segs
      .map((seg) =>
        seg.isProperty() ? `/properties/${seg.propertyName()}` : '/items',
      )
      .join('');
  }

  asSimple(): string {
    const parts: string[] = [];

    for (const seg of this.segs) {
      if (seg.isProperty()) {
        parts.push(seg.propertyName());
      } else if (seg.isItems() && parts.length > 0) {
        parts[parts.length - 1] += '[*]';
      }
    }

    return parts.join('.');
  }

  parent(): Path {
    if (this.segs.length <= 1) {
      return EMPTY_PATH;
    }
    return new SegmentPathImpl(this.segs.slice(0, -1));
  }

  child(name: string): Path {
    return new SegmentPathImpl([...this.segs, new PropertySegment(name)]);
  }

  childItems(): Path {
    return new SegmentPathImpl([...this.segs, ITEMS_SEGMENT]);
  }

  equals(other: Path): boolean {
    if (other.isEmpty()) {
      return false;
    }
    const otherSegs = other.segments();
    if (this.segs.length !== otherSegs.length) {
      return false;
    }
    for (let i = 0; i < this.segs.length; i++) {
      const a = this.segs[i];
      const b = otherSegs[i];
      if (!a || !b || !a.equals(b)) {
        return false;
      }
    }
    return true;
  }

  isEmpty(): boolean {
    return false;
  }

  length(): number {
    return this.segs.length;
  }

  lastSegment(): PathSegment | null {
    return this.segs.at(-1) ?? null;
  }

  isChildOf(parent: Path): boolean {
    if (parent.isEmpty()) {
      return true;
    }
    const parentSegs = parent.segments();
    if (this.segs.length <= parentSegs.length) {
      return false;
    }
    for (let i = 0; i < parentSegs.length; i++) {
      const a = this.segs[i];
      const b = parentSegs[i];
      if (!a || !b || !a.equals(b)) {
        return false;
      }
    }
    return true;
  }

  getTopLevel(): Path | null {
    const first = this.segs[0];
    if (!first?.isProperty()) {
      return null;
    }
    return new SegmentPathImpl([first]);
  }
}

export const EMPTY_PATH: Path = new EmptyPathImpl();

export class PathFromSegments extends ParsedPathBase {
  protected readonly parsed: Path;

  constructor(segments: readonly PathSegment[]) {
    super();
    this.parsed =
      segments.length === 0 ? EMPTY_PATH : new SegmentPathImpl(segments);
  }
}
