import type { Path } from './Path';
import type { PathSegment } from './PathSegment';
import { PropertySegment, ITEMS_SEGMENT } from './PathSegment';
import { EMPTY_PATH, PathFromSegments } from './Paths';

export class JsonPointerPath implements Path {
  private readonly parsed: Path;

  constructor(private readonly pointer: string) {
    this.parsed = this.parse();
  }

  private parse(): Path {
    if (this.pointer === '' || this.pointer === '/') {
      return EMPTY_PATH;
    }

    const parts = this.pointer.split('/').filter(Boolean);
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
        throw new Error(
          `Invalid path segment: ${part} in path ${this.pointer}`,
        );
      }
    }

    return new PathFromSegments(segments);
  }

  segments(): readonly PathSegment[] {
    return this.parsed.segments();
  }

  asJsonPointer(): string {
    return this.pointer;
  }

  asSimple(): string {
    return this.parsed.asSimple();
  }

  parent(): Path {
    return this.parsed.parent();
  }

  child(name: string): Path {
    return this.parsed.child(name);
  }

  childItems(): Path {
    return this.parsed.childItems();
  }

  equals(other: Path): boolean {
    return this.parsed.equals(other);
  }

  isEmpty(): boolean {
    return this.parsed.isEmpty();
  }

  length(): number {
    return this.parsed.length();
  }

  lastSegment(): PathSegment | null {
    return this.parsed.lastSegment();
  }
}
