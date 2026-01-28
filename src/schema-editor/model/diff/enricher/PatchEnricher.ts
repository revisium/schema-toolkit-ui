import type { SchemaNode } from '../../node/SchemaNode';
import type { SchemaTree } from '../../tree/SchemaTree';
import { PathUtils } from '../../path/PathUtils';
import { NodeMetadataExtractor } from './NodeMetadataExtractor';
import type { JsonPatch, SchemaPatch } from '../SchemaPatch';

export class PatchEnricher {
  private readonly metadataExtractor = new NodeMetadataExtractor();

  constructor(
    private readonly currentTree: SchemaTree,
    private readonly baseTree: SchemaTree,
  ) {}

  public enrich(patch: JsonPatch): SchemaPatch {
    const fieldName = this.getFieldNameFromPath(patch.path);

    if (patch.op === 'add') {
      return this.enrichAddPatch(patch, fieldName);
    }

    if (patch.op === 'remove') {
      return { patch, fieldName, metadataChanges: [] };
    }

    if (patch.op === 'move') {
      return this.enrichMovePatch(patch, fieldName);
    }

    return this.enrichReplacePatch(patch, fieldName);
  }

  private enrichAddPatch(patch: JsonPatch, fieldName: string): SchemaPatch {
    const currentNode = this.getNodeAtPath(this.currentTree, patch.path);

    const {
      metadataChanges,
      formulaChange,
      defaultChange,
      descriptionChange,
      deprecatedChange,
    } = this.metadataExtractor.computeMetadataChanges(
      this.baseTree,
      null,
      this.currentTree,
      currentNode,
    );

    return {
      patch,
      fieldName,
      metadataChanges,
      formulaChange,
      defaultChange,
      descriptionChange,
      deprecatedChange,
    };
  }

  private enrichMovePatch(patch: JsonPatch, fieldName: string): SchemaPatch {
    const fromPath = patch.from || '';
    const isRename = this.isRenameMove(fromPath, patch.path);
    const movesIntoArray = this.movesIntoArrayBoundary(fromPath, patch.path);

    const baseNode = this.getNodeAtPath(this.baseTree, fromPath);
    const currentNode = this.getNodeAtPath(this.currentTree, patch.path);

    const baseFormula = this.metadataExtractor.getFormulaExpression(
      this.baseTree,
      baseNode,
    );
    const currentFormula = this.metadataExtractor.getFormulaExpression(
      this.currentTree,
      currentNode,
    );

    const formulaChange =
      baseFormula !== currentFormula
        ? { fromFormula: baseFormula, toFormula: currentFormula }
        : undefined;

    return {
      patch,
      fieldName,
      metadataChanges: formulaChange ? ['formula'] : [],
      isRename: isRename || undefined,
      movesIntoArray: movesIntoArray || undefined,
      formulaChange,
    };
  }

  private enrichReplacePatch(patch: JsonPatch, fieldName: string): SchemaPatch {
    const baseNode = this.getNodeAtPath(this.baseTree, patch.path);
    const currentNode = this.getNodeAtPath(this.currentTree, patch.path);

    const {
      metadataChanges,
      formulaChange,
      defaultChange,
      descriptionChange,
      deprecatedChange,
    } = this.metadataExtractor.computeMetadataChanges(
      this.baseTree,
      baseNode,
      this.currentTree,
      currentNode,
    );

    const typeChanged = this.metadataExtractor.hasTypeChanged(
      baseNode,
      currentNode,
    );

    return {
      patch,
      fieldName,
      metadataChanges,
      typeChange: typeChanged
        ? {
            fromType: this.metadataExtractor.getNodeType(baseNode),
            toType: this.metadataExtractor.getNodeType(currentNode),
          }
        : undefined,
      formulaChange,
      defaultChange,
      descriptionChange,
      deprecatedChange,
    };
  }

  private getFieldNameFromPath(jsonPointer: string): string {
    try {
      const path = PathUtils.jsonPointerToPath(jsonPointer);
      return PathUtils.getFieldNameFromPath(path);
    } catch {
      return '';
    }
  }

  private isRenameMove(fromPath: string, toPath: string): boolean {
    return (
      PathUtils.getParentJsonPointer(fromPath) ===
      PathUtils.getParentJsonPointer(toPath)
    );
  }

  private movesIntoArrayBoundary(fromPath: string, toPath: string): boolean {
    return (
      PathUtils.countArrayDepthFromJsonPointer(toPath) >
      PathUtils.countArrayDepthFromJsonPointer(fromPath)
    );
  }

  private getNodeAtPath(
    tree: SchemaTree,
    jsonPointer: string,
  ): SchemaNode | null {
    try {
      const path = PathUtils.jsonPointerToPath(jsonPointer);
      const node = tree.nodeAt(path);
      return node.isNull() ? null : node;
    } catch {
      return null;
    }
  }
}
