import type { Path } from './Path';
import { ParsedPathBase } from './ParsedPathBase';
import { PathUtils } from './PathUtils';

export class JsonPointerPath extends ParsedPathBase {
  protected readonly parsed: Path;

  constructor(private readonly pointer: string) {
    super();
    this.parsed = PathUtils.jsonPointerToPath(this.pointer);
  }

  override asJsonPointer(): string {
    return this.pointer;
  }
}
