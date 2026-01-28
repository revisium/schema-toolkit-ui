import type { ASTNode } from '@revisium/formula';
import type { Formula } from '../core/Formula';
import type { NodeTree } from '../../tree/NodeTree';
import { FormulaError } from '../core/FormulaError';
import type { XFormula } from '../../schema/JsonSchema';
import { RelativePathBuilder } from './RelativePathBuilder';

export class FormulaSerializer {
  private readonly relativePathBuilder = new RelativePathBuilder();

  constructor(
    private readonly tree: NodeTree,
    private readonly formulaNodeId: string,
    private readonly formula: Formula,
  ) {}

  static toXFormula(
    tree: NodeTree,
    formulaNodeId: string,
    formula: Formula,
  ): XFormula {
    const serializer = new FormulaSerializer(tree, formulaNodeId, formula);
    return {
      version: 1,
      expression: serializer.serialize(),
    };
  }

  serialize(): string {
    return this.serializeAst(this.formula.ast(), true);
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

      case 'Identifier':
        return this.serializePath(ast.name);

      case 'RootPath':
      case 'RelativePath':
        return this.serializePath(ast.path);

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
          return this.serializePath(fullPath);
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

  private serializePath(astPath: string): string {
    const nodeId = this.formula.getNodeIdForAstPath(astPath);
    if (!nodeId) {
      return astPath;
    }

    const targetNode = this.tree.nodeById(nodeId);
    if (targetNode.isNull()) {
      throw new FormulaError(
        `Cannot serialize formula: target node not found`,
        this.formulaNodeId,
        `Target nodeId: ${nodeId}`,
      );
    }

    const formulaPath = this.tree.pathOf(this.formulaNodeId);
    const targetPath = this.tree.pathOf(nodeId);

    return this.relativePathBuilder.buildWithArrayNotation(
      formulaPath,
      targetPath,
    );
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
