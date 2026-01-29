import { makeAutoObservable } from 'mobx';
import { SchemaTree } from '../tree/SchemaTree';
import { SchemaDiff } from '../diff/SchemaDiff';
import { SchemaParser } from '../schema/SchemaParser';
import { SchemaValidator } from '../validation/SchemaValidator';
import { FormulaValidator } from '../validation/FormulaValidator';
import { ParsedFormula, FormulaError } from '../formula';
import { NodeFactory } from '../node/NodeFactory';
import { NodeType } from '../node/NodeType';
import { NULL_NODE } from '../node/NullNode';
import type { JsonObjectSchema } from '../schema/JsonSchema';
import type { SchemaPatch } from '../diff/index';
import type { ValidationError } from '../validation/SchemaValidator';
import type { FormulaValidationError } from '../validation/FormulaValidator';
import type { SchemaNode } from '../node/SchemaNode';
import type { FormulaDependent } from '../formula';
import type { StringNode } from '../node/StringNode';

export interface ReplaceResult {
  replacedNodeId: string;
  newNodeId: string;
}

export interface FormulaUpdateResult {
  success: boolean;
  error?: string;
}

interface FormulaParseError {
  nodeId: string;
  expression: string;
  message: string;
}

export class SchemaEngine {
  private readonly _tree: SchemaTree;
  private readonly _diff: SchemaDiff;
  private readonly _schemaValidator = new SchemaValidator();
  private readonly _formulaValidator: FormulaValidator;
  private _formulaParseErrors: FormulaParseError[] = [];

  constructor(jsonSchema: JsonObjectSchema) {
    const parser = new SchemaParser();
    const root = parser.parse(jsonSchema);
    this._tree = new SchemaTree(root);
    this._formulaValidator = new FormulaValidator(this._tree);

    this._formulaParseErrors = this.applyPendingFormulas(
      parser.getPendingFormulas(),
    );

    this._diff = new SchemaDiff(this._tree);

    makeAutoObservable(this, {}, { autoBind: true });
  }

  private applyPendingFormulas(
    pending: { nodeId: string; expression: string }[],
  ): FormulaParseError[] {
    const errors: FormulaParseError[] = [];

    for (const { nodeId, expression } of pending) {
      const node = this._tree.nodeById(nodeId);
      if (node.isNull()) {
        continue;
      }

      try {
        const formula = new ParsedFormula(this._tree, nodeId, expression);
        node.setFormula(formula);
        this._tree.registerFormula(nodeId, formula);
      } catch (error) {
        const message = this.extractErrorMessage(error);
        errors.push({ nodeId, expression, message });
      }
    }

    return errors;
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof FormulaError) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown formula error';
  }

  public get tree(): SchemaTree {
    return this._tree;
  }

  public get diff(): SchemaDiff {
    return this._diff;
  }

  public root(): SchemaNode {
    return this._tree.root();
  }

  public nodeById(nodeId: string): SchemaNode {
    return this._tree.nodeById(nodeId);
  }

  public countNodes(): number {
    return this._tree.countNodes();
  }

  public getFormulaDependents(nodeId: string): FormulaDependent[] {
    return this._tree.getDirectFormulaDependents(nodeId);
  }

  public get isDirty(): boolean {
    return this._diff.isDirty();
  }

  public get isValid(): boolean {
    const root = this._tree.root();
    if (root.isNull()) {
      return false;
    }
    if (root.isObject()) {
      return root.properties().length > 0;
    }
    return true;
  }

  public get validationErrors(): readonly ValidationError[] {
    return this._schemaValidator.validate(this._tree.root());
  }

  public validateFormulas(): FormulaValidationError[] {
    const validatorErrors = this._formulaValidator.validate();
    const parseErrors: FormulaValidationError[] = this._formulaParseErrors.map(
      (e) => ({
        nodeId: e.nodeId,
        message: e.message,
      }),
    );
    return [...parseErrors, ...validatorErrors];
  }

  public markAsSaved(): void {
    this._diff.markAsSaved();
  }

  public revert(): void {
    const baseSchema = this._diff.getBaseSchema();
    const parser = new SchemaParser();
    const root = parser.parse(baseSchema);

    this._tree.clearFormulaIndex();
    this._tree.replaceRoot(root);
    this._formulaParseErrors = this.applyPendingFormulas(
      parser.getPendingFormulas(),
    );

    this._diff.markAsSaved();
  }

  public getPatches(): SchemaPatch[] {
    return this._diff.getPatches();
  }

  public getPlainSchema(): JsonObjectSchema {
    return this._diff.getCurrentSchema();
  }

  public canMoveNode(fromNodeId: string, toNodeId: string): boolean {
    return this._tree.canMoveNode(fromNodeId, toNodeId);
  }

  public hasValidDropTarget(nodeId: string): boolean {
    return this._tree.hasValidDropTarget(nodeId);
  }

  public moveNode(nodeId: string, targetObjectId: string): void {
    if (!this.canMoveNode(nodeId, targetObjectId)) {
      return;
    }
    this._tree.moveNode(nodeId, targetObjectId);
  }

  public renameNode(nodeId: string, newName: string): void {
    this._tree.renameNode(nodeId, newName);
  }

  public updateNodeMetadata(
    nodeId: string,
    metadata: { description?: string; deprecated?: boolean },
  ): void {
    const node = this._tree.nodeById(nodeId);
    if (node.isNull()) {
      return;
    }
    const currentMeta = node.metadata();
    node.setMetadata({
      description:
        'description' in metadata
          ? metadata.description || undefined
          : currentMeta.description,
      deprecated:
        'deprecated' in metadata ? metadata.deprecated : currentMeta.deprecated,
    });
  }

  public updateDefaultValue(
    nodeId: string,
    value: string | number | boolean | undefined,
  ): void {
    const node = this._tree.nodeById(nodeId);
    if (node.isNull()) {
      return;
    }
    node.setDefaultValue(value);
  }

  public addChild(parentId: string, name: string): SchemaNode {
    const parent = this._tree.nodeById(parentId);
    if (parent.isNull() || !parent.isObject()) {
      return NULL_NODE;
    }
    const newNode = NodeFactory.string(name);
    this._tree.addChildTo(parentId, newNode);
    return newNode;
  }

  public removeNode(nodeId: string): boolean {
    const node = this._tree.nodeById(nodeId);
    if (node.isNull()) {
      return false;
    }
    const path = this._tree.pathOf(nodeId);
    if (path.isEmpty()) {
      return false;
    }
    this._tree.removeNodeAt(path);
    return true;
  }

  public replaceNode(
    nodeId: string,
    newNode: SchemaNode,
  ): ReplaceResult | null {
    const currentNode = this._tree.nodeById(nodeId);
    if (currentNode.isNull()) {
      return null;
    }
    const path = this._tree.pathOf(nodeId);
    if (path.isEmpty()) {
      return null;
    }
    this._tree.setNodeAt(path, newNode);
    this._diff.trackReplacement(nodeId, newNode.id());
    return {
      replacedNodeId: nodeId,
      newNodeId: newNode.id(),
    };
  }

  public wrapInArray(nodeId: string): ReplaceResult | null {
    const currentNode = this._tree.nodeById(nodeId);
    if (currentNode.isNull()) {
      return null;
    }
    if (currentNode.isArray()) {
      return null;
    }
    const path = this._tree.pathOf(nodeId);
    if (path.isEmpty()) {
      return null;
    }
    const name = currentNode.name();
    const arrayNode = NodeFactory.array(name, currentNode);
    this._tree.setNodeAt(path, arrayNode);
    currentNode.setName('');
    this._diff.trackReplacement(nodeId, arrayNode.id());
    return {
      replacedNodeId: nodeId,
      newNodeId: arrayNode.id(),
    };
  }

  public replaceRootWith(newNode: SchemaNode): ReplaceResult | null {
    const currentRoot = this._tree.root();
    if (currentRoot.isNull()) {
      return null;
    }
    const oldId = currentRoot.id();
    newNode.setName(currentRoot.name());
    this._tree.replaceRoot(newNode);
    this._diff.trackReplacement(oldId, newNode.id());
    return {
      replacedNodeId: oldId,
      newNodeId: newNode.id(),
    };
  }

  public wrapRootInArray(): ReplaceResult | null {
    const currentRoot = this._tree.root();
    if (currentRoot.isNull() || currentRoot.isArray()) {
      return null;
    }
    const oldId = currentRoot.id();
    const name = currentRoot.name();
    const arrayNode = NodeFactory.array(name, currentRoot);
    currentRoot.setName('');
    this._tree.replaceRoot(arrayNode);
    this._diff.trackReplacement(oldId, arrayNode.id());
    return {
      replacedNodeId: oldId,
      newNodeId: arrayNode.id(),
    };
  }

  public updateForeignKey(nodeId: string, tableId: string): boolean {
    const node = this._tree.nodeById(nodeId);
    if (node.isNull() || node.nodeType() !== NodeType.String) {
      return false;
    }
    (node as StringNode).setForeignKey(tableId || undefined);
    return true;
  }

  public updateFormula(
    nodeId: string,
    expression: string | undefined,
  ): FormulaUpdateResult {
    const node = this._tree.nodeById(nodeId);
    if (node.isNull()) {
      return { success: false, error: 'Node not found' };
    }
    try {
      const formula = expression
        ? new ParsedFormula(this._tree, nodeId, expression)
        : undefined;
      node.setFormula(formula);
      if (formula) {
        this._tree.registerFormula(nodeId, formula);
      } else {
        this._tree.unregisterFormula(nodeId);
      }
      this._formulaParseErrors = this._formulaParseErrors.filter(
        (e) => e.nodeId !== nodeId,
      );
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof FormulaError ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }

  public createStringNode(name: string): SchemaNode {
    return NodeFactory.string(name);
  }

  public createNumberNode(name: string): SchemaNode {
    return NodeFactory.number(name);
  }
}
