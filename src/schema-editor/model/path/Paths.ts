import type { Path } from './Path';
import type { PathSegment } from './PathSegment';
import { PropertySegment, ITEMS_SEGMENT } from './PathSegment';

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
}

export const EMPTY_PATH: Path = new EmptyPathImpl();

export class PathFromSegments implements Path {
  private readonly inner: Path;

  constructor(segments: readonly PathSegment[]) {
    this.inner =
      segments.length === 0 ? EMPTY_PATH : new SegmentPathImpl(segments);
  }

  segments(): readonly PathSegment[] {
    return this.inner.segments();
  }

  asJsonPointer(): string {
    return this.inner.asJsonPointer();
  }

  asSimple(): string {
    return this.inner.asSimple();
  }

  parent(): Path {
    return this.inner.parent();
  }

  child(name: string): Path {
    return this.inner.child(name);
  }

  childItems(): Path {
    return this.inner.childItems();
  }

  equals(other: Path): boolean {
    return this.inner.equals(other);
  }

  isEmpty(): boolean {
    return this.inner.isEmpty();
  }

  length(): number {
    return this.inner.length();
  }

  lastSegment(): PathSegment | null {
    return this.inner.lastSegment();
  }
}
