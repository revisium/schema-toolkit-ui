export type PathSegment =
  | { type: 'property'; name: string }
  | { type: 'index'; index: number }
  | { type: 'items' };

export class Path {
  private constructor(private readonly _segments: readonly PathSegment[]) {}

  static empty(): Path {
    return new Path([]);
  }

  static fromString(path: string): Path {
    if (!path || path === '') {
      return Path.empty();
    }

    const segments: PathSegment[] = [];
    let current = path;

    while (current.length > 0) {
      const indexMatch = current.match(/^\[(\d+)\]/);
      if (indexMatch && indexMatch[1] !== undefined) {
        segments.push({ type: 'index', index: parseInt(indexMatch[1], 10) });
        current = current.slice(indexMatch[0].length);
        continue;
      }

      if (current.startsWith('[*]')) {
        segments.push({ type: 'items' });
        current = current.slice(3);
        continue;
      }

      const propMatch = current.match(/^\.?([a-zA-Z_]\w*)/);
      if (propMatch && propMatch[1] !== undefined) {
        segments.push({ type: 'property', name: propMatch[1] });
        current = current.slice(propMatch[0].length);
        continue;
      }

      throw new Error(`Invalid path segment: ${current}`);
    }

    return new Path(segments);
  }

  static fromSegments(segments: readonly PathSegment[]): Path {
    return new Path([...segments]);
  }

  segments(): readonly PathSegment[] {
    return this._segments;
  }

  isEmpty(): boolean {
    return this._segments.length === 0;
  }

  length(): number {
    return this._segments.length;
  }

  first(): PathSegment | undefined {
    return this._segments[0];
  }

  last(): PathSegment | undefined {
    return this._segments[this._segments.length - 1];
  }

  parent(): Path {
    if (this._segments.length === 0) {
      return this;
    }
    return new Path(this._segments.slice(0, -1));
  }

  child(name: string): Path {
    return new Path([...this._segments, { type: 'property', name }]);
  }

  childIndex(index: number): Path {
    return new Path([...this._segments, { type: 'index', index }]);
  }

  childItems(): Path {
    return new Path([...this._segments, { type: 'items' }]);
  }

  isChildOf(parent: Path): boolean {
    if (parent._segments.length >= this._segments.length) {
      return false;
    }

    for (let i = 0; i < parent._segments.length; i++) {
      const parentSeg = parent._segments[i];
      const thisSeg = this._segments[i];
      if (!parentSeg || !thisSeg || !this.segmentEquals(parentSeg, thisSeg)) {
        return false;
      }
    }

    return true;
  }

  equals(other: Path): boolean {
    if (this._segments.length !== other._segments.length) {
      return false;
    }

    for (let i = 0; i < this._segments.length; i++) {
      const thisSeg = this._segments[i];
      const otherSeg = other._segments[i];
      if (!thisSeg || !otherSeg || !this.segmentEquals(thisSeg, otherSeg)) {
        return false;
      }
    }

    return true;
  }

  asSimple(): string {
    let result = '';

    for (const segment of this._segments) {
      if (segment.type === 'property') {
        if (result.length > 0) {
          result += '.';
        }
        result += segment.name;
      } else if (segment.type === 'index') {
        result += `[${segment.index}]`;
      } else if (segment.type === 'items') {
        result += '[*]';
      }
    }

    return result;
  }

  asJsonPointer(): string {
    if (this._segments.length === 0) {
      return '';
    }

    let result = '';

    for (const segment of this._segments) {
      if (segment.type === 'property') {
        result += '/' + segment.name;
      } else if (segment.type === 'index') {
        result += '/' + segment.index;
      } else if (segment.type === 'items') {
        result += '/-';
      }
    }

    return result;
  }

  private segmentEquals(a: PathSegment, b: PathSegment): boolean {
    if (a.type !== b.type) {
      return false;
    }

    if (a.type === 'property' && b.type === 'property') {
      return a.name === b.name;
    }

    if (a.type === 'index' && b.type === 'index') {
      return a.index === b.index;
    }

    return true;
  }
}
