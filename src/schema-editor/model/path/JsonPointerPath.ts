import type { Path } from './Path';
import type { PathSegment } from './PathSegment';
import { PropertySegment, ITEMS_SEGMENT } from './PathSegment';
import { EMPTY_PATH, PathFromSegments } from './Paths';
import { ParsedPathBase } from './ParsedPathBase';

export class JsonPointerPath extends ParsedPathBase {
  protected readonly parsed: Path;

  constructor(private readonly pointer: string) {
    super();
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

  override asJsonPointer(): string {
    return this.pointer;
  }
}
