import type { Path } from './Path';
import type { PathSegment } from './PathSegment';
import { PropertySegment, ITEMS_SEGMENT } from './PathSegment';
import { EMPTY_PATH, PathFromSegments } from './Paths';
import { ParsedPathBase } from './ParsedPathBase';

export class SimplePath extends ParsedPathBase {
  protected readonly parsed: Path;

  constructor(private readonly path: string) {
    super();
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

      const bracketMatch = /^([^[]+)\[(?:\d+|\*)?\]$/.exec(part);
      if (bracketMatch) {
        const propertyName = bracketMatch[1];
        if (propertyName) {
          segments.push(new PropertySegment(propertyName), ITEMS_SEGMENT);
        }
      } else {
        segments.push(new PropertySegment(part));
      }
    }

    return new PathFromSegments(segments);
  }

  override asSimple(): string {
    return this.path;
  }
}
