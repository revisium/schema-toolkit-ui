import { parseFormula, type ASTNode } from '@revisium/formula';
import type { Path } from '../path/Path';
import { PathFromSegments } from '../path/Paths';
import { PropertySegment, ITEMS_SEGMENT } from '../path/PathSegment';
import type { PathSegment } from '../path/PathSegment';
import { PathUtils } from '../path/PathUtils';

export class RelativePath {
  constructor(
    private readonly basePath: Path,
    private readonly relativePath: string,
  ) {}

  resolve(): Path | null {
    let ast: ASTNode;
    try {
      const parseResult = parseFormula(this.relativePath);
      ast = parseResult.ast;
    } catch {
      return null;
    }

    const baseSegments = [...this.basePath.segments()];
    const resolved = this.astToSegments(ast, baseSegments);

    if (!resolved) {
      return null;
    }

    return new PathFromSegments(resolved);
  }

  private astToSegments(
    ast: ASTNode,
    baseSegments: PathSegment[],
  ): PathSegment[] | null {
    switch (ast.type) {
      case 'Identifier':
        return [...baseSegments, new PropertySegment(ast.name)];

      case 'MemberExpression': {
        const objectPath = this.astToSegments(ast.object, baseSegments);
        if (!objectPath) {
          return null;
        }
        return [...objectPath, new PropertySegment(ast.property)];
      }

      case 'IndexExpression':
      case 'WildcardExpression': {
        const objectPath = this.astToSegments(ast.object, baseSegments);
        if (!objectPath) {
          return null;
        }
        return [...objectPath, ITEMS_SEGMENT];
      }

      case 'RelativePath':
        return this.resolveRelativePathString(baseSegments, ast.path);

      case 'RootPath':
        return this.resolveRootPath(ast.path);

      default:
        return null;
    }
  }

  private resolveRelativePathString(
    baseSegments: PathSegment[],
    path: string,
  ): PathSegment[] | null {
    const parts = path.split('/');
    const result = [...baseSegments];

    for (const part of parts) {
      if (part === '..') {
        if (result.length === 0) {
          return null;
        }
        result.pop();
      } else if (part === '.') {
        continue;
      } else if (part) {
        result.push(new PropertySegment(part));
      }
    }

    return result;
  }

  private resolveRootPath(rootPath: string): PathSegment[] | null {
    const path = rootPath.startsWith('/') ? rootPath.slice(1) : rootPath;
    if (!path) {
      return [];
    }

    try {
      return PathUtils.simplePathToSegments(path);
    } catch {
      return null;
    }
  }
}
