import type { PathSegment } from './PathSegment';

export interface Path {
  segments(): readonly PathSegment[];
  asJsonPointer(): string;
  asSimple(): string;
  parent(): Path;
  child(name: string): Path;
  childItems(): Path;
  equals(other: Path): boolean;
  isEmpty(): boolean;
  length(): number;
  lastSegment(): PathSegment | null;
}
