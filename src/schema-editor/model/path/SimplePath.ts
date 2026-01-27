import type { Path } from './Path';
import type { PathSegment } from './PathSegment';
import { PropertySegment, ITEMS_SEGMENT } from './PathSegment';
import { EMPTY_PATH, PathFromSegments } from './Paths';

export class SimplePath implements Path {
  private readonly parsed: Path;

  constructor(private readonly path: string) {
    this.parsed = this.parse();
  }

  private parse(): Path {
    if (!this.path) {
      return EMPTY_PATH;
    }

    const parts = this.path.split('.');
    const segments: PathSegment[] = [];

    for (const part of parts) {
      if (!part) {
        throw new Error(`Invalid simple path: empty segment in "${this.path}"`);
      }

      const bracketMatch = part.match(/^([^[]+)\[(\d+|\*)?\]$/);
      if (bracketMatch) {
        const propertyName = bracketMatch[1];
        if (propertyName) {
          segments.push(new PropertySegment(propertyName));
          segments.push(ITEMS_SEGMENT);
        }
      } else {
        segments.push(new PropertySegment(part));
      }
    }

    return new PathFromSegments(segments);
  }

  segments(): readonly PathSegment[] {
    return this.parsed.segments();
  }

  asJsonPointer(): string {
    return this.parsed.asJsonPointer();
  }

  asSimple(): string {
    return this.path;
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
