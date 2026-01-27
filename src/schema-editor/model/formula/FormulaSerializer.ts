import type { ASTNode } from '@revisium/formula';
import type { Formula } from './Formula';
import type { NodeTree } from '../tree/NodeTree';
import type { Path } from '../path/Path';
import { FormulaError } from './FormulaError';
import type { XFormula } from '../schema/JsonSchema';

export class FormulaSerializer {
  private readonly pathMapping: Map<string, string>;

  constructor(
    private readonly tree: NodeTree,
    private readonly formulaNodeId: string,
    private readonly formula: Formula,
  ) {
    this.pathMapping = this.buildPathMapping();
  }

  static toXFormula(formula: Formula): XFormula {
    return {
      version: 1,
      expression: formula.expression(),
    };
  }

  serialize(): string {
    return this.serializeAst(this.formula.ast(), true);
  }

  private buildPathMapping(): Map<string, string> {
    const mapping = new Map<string, string>();
    const formulaPath = this.tree.pathOf(this.formulaNodeId);

    for (const dep of this.formula.dependencies()) {
      const targetPath = this.tree.pathOf(dep.targetNodeId());
      const targetNode = this.tree.nodeById(dep.targetNodeId());

      if (targetNode.isNull()) {
        throw new FormulaError(
          `Cannot build path to dependency: target node not found`,
          this.formulaNodeId,
          `Original path: ${dep.originalPath()}`,
        );
      }

      const relativePath = this.buildRelativePath(formulaPath, targetPath);
      mapping.set(dep.originalPath(), relativePath);
    }

    return mapping;
  }

  private buildRelativePath(fromPath: Path, toPath: Path): string {
    const fromSegments = fromPath.parent().segments();
    const toSegments = toPath.segments();

    const commonLength = this.findCommonPrefixLength(fromSegments, toSegments);
    const upCount = fromSegments.length - commonLength;

    const parts = this.buildPathParts(upCount, toSegments, commonLength);

    return this.formatPathParts(parts, toSegments);
  }

  private findCommonPrefixLength(
    fromSegments: readonly { equals(other: unknown): boolean }[],
    toSegments: readonly { equals(other: unknown): boolean }[],
  ): number {
    const minLength = Math.min(fromSegments.length, toSegments.length);
    let commonLength = 0;

    for (let i = 0; i < minLength; i++) {
      const from = fromSegments[i];
      const to = toSegments[i];
      if (from && to && from.equals(to)) {
        commonLength++;
      } else {
        break;
      }
    }

    return commonLength;
  }

  private buildPathParts(
    upCount: number,
    toSegments: readonly { isProperty(): boolean; propertyName(): string }[],
    startIndex: number,
  ): string[] {
    const parts: string[] = [];

    for (let i = 0; i < upCount; i++) {
      parts.push('..');
    }

    for (let i = startIndex; i < toSegments.length; i++) {
      const seg = toSegments[i];
      if (seg) {
        this.appendSegmentToParts(parts, seg);
      }
    }

    return parts;
  }

  private appendSegmentToParts(
    parts: string[],
    seg: { isProperty(): boolean; propertyName(): string },
  ): void {
    if (seg.isProperty()) {
      parts.push(seg.propertyName());
    } else {
      const lastPart = parts.at(-1);
      if (lastPart && lastPart !== '..') {
        parts[parts.length - 1] = lastPart + '[*]';
      }
    }
  }

  private formatPathParts(
    parts: string[],
    toSegments: readonly { isProperty(): boolean; propertyName(): string }[],
  ): string {
    if (parts.length === 0) {
      return this.extractLastPropertyName(toSegments);
    }

    if (parts[0] === '..') {
      return parts.join('/');
    }

    return parts.join('.');
  }

  private extractLastPropertyName(
    segments: readonly { isProperty(): boolean; propertyName(): string }[],
  ): string {
    const lastSeg = segments.at(-1);
    if (lastSeg?.isProperty()) {
      return lastSeg.propertyName();
    }
    return '';
  }

  private serializeAst(ast: ASTNode, isTopLevel = false): string {
    switch (ast.type) {
      case 'NumberLiteral':
        return String(ast.value);

      case 'StringLiteral':
        return JSON.stringify(ast.value);

      case 'BooleanLiteral':
        return String(ast.value);

      case 'NullLiteral':
        return 'null';

      case 'Identifier': {
        const newPath = this.pathMapping.get(ast.name);
        return newPath ?? ast.name;
      }

      case 'RootPath':
      case 'RelativePath': {
        const newPath = this.pathMapping.get(ast.path);
        return newPath ?? ast.path;
      }

      case 'ContextToken':
        return `$${ast.name}`;

      case 'BinaryOp': {
        const left = this.serializeAst(ast.left);
        const right = this.serializeAst(ast.right);
        const expr = `${left} ${ast.op} ${right}`;
        return isTopLevel ? expr : `(${expr})`;
      }

      case 'UnaryOp': {
        const arg = this.serializeAst(ast.argument);
        return `${ast.op}${arg}`;
      }

      case 'TernaryOp': {
        const condition = this.serializeAst(ast.condition);
        const consequent = this.serializeAst(ast.consequent);
        const alternate = this.serializeAst(ast.alternate);
        const expr = `${condition} ? ${consequent} : ${alternate}`;
        return isTopLevel ? expr : `(${expr})`;
      }

      case 'CallExpression': {
        const callee = this.serializeAst(ast.callee);
        const args = ast.arguments.map((arg: ASTNode) =>
          this.serializeAst(arg),
        );
        return `${callee}(${args.join(', ')})`;
      }

      case 'MemberExpression': {
        const fullPath = this.reconstructMemberPath(ast);
        if (fullPath) {
          const newPath = this.pathMapping.get(fullPath);
          if (newPath !== undefined) {
            return newPath;
          }
        }
        const obj = this.serializeAst(ast.object);
        return `${obj}.${ast.property}`;
      }

      case 'IndexExpression': {
        const obj = this.serializeAst(ast.object);
        const index = this.serializeAst(ast.index);
        return `${obj}[${index}]`;
      }

      case 'WildcardExpression': {
        const obj = this.serializeAst(ast.object);
        return `${obj}[*]`;
      }

      default:
        throw new Error(`Unknown AST node type: ${(ast as ASTNode).type}`);
    }
  }

  private reconstructMemberPath(ast: ASTNode): string | null {
    if (ast.type === 'Identifier') {
      return ast.name;
    }

    if (ast.type === 'MemberExpression') {
      const objectPath = this.reconstructMemberPath(ast.object);
      if (objectPath === null) {
        return null;
      }
      return `${objectPath}.${ast.property}`;
    }

    if (ast.type === 'IndexExpression') {
      const objectPath = this.reconstructMemberPath(ast.object);
      if (objectPath === null) {
        return null;
      }
      if (ast.index.type === 'NumberLiteral') {
        return `${objectPath}[${ast.index.value}]`;
      }
      return null;
    }

    if (ast.type === 'WildcardExpression') {
      const objectPath = this.reconstructMemberPath(ast.object);
      if (objectPath === null) {
        return null;
      }
      return `${objectPath}[*]`;
    }

    return null;
  }
}
