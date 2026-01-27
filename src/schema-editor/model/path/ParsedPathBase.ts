import type { Path } from './Path';
import type { PathSegment } from './PathSegment';

export abstract class ParsedPathBase implements Path {
  protected abstract readonly parsed: Path;

  segments(): readonly PathSegment[] {
    return this.parsed.segments();
  }

  asJsonPointer(): string {
    return this.parsed.asJsonPointer();
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
