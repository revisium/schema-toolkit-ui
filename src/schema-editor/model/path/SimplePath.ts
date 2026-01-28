import type { Path } from './Path';
import { ParsedPathBase } from './ParsedPathBase';
import { PathUtils } from './PathUtils';

export class SimplePath extends ParsedPathBase {
  protected readonly parsed: Path;

  constructor(private readonly path: string) {
    super();
    this.parsed = PathUtils.simplePathToPath(this.path);
  }

  override asSimple(): string {
    return this.path;
  }
}
