import { makeObservable, computed, action } from 'mobx';
import type { Diagnostic, Change, JsonPatch } from '../core/types';
import { Path } from '../core/Path';
import type { PathSegment } from '../core/Path';
import type { ValueNode, DirtyTrackable } from '../node/types';
import { TreeIndex } from './TreeIndex';
import { ChangeTracker } from './ChangeTracker';
import type { FormulaEngine } from '../formula/FormulaEngine';

export class ValueTree {
  private readonly index: TreeIndex;
  private readonly changeTracker: ChangeTracker;
  private _formulaEngine: FormulaEngine | null = null;

  constructor(private readonly _root: ValueNode) {
    this.index = new TreeIndex(_root);
    this.changeTracker = new ChangeTracker();

    makeObservable(this, {
      allErrors: computed,
      allWarnings: computed,
      allDiagnostics: computed,
      isValid: computed,
      hasDiagnostics: computed,
      isDirty: computed,
      commit: action,
      revert: action,
    });
  }

  get root(): ValueNode {
    return this._root;
  }

  nodeById(id: string): ValueNode | undefined {
    return this.index.nodeById(id);
  }

  get(path: string): ValueNode | undefined {
    return this.getByPath(Path.fromString(path));
  }

  getByPath(path: Path): ValueNode | undefined {
    if (path.isEmpty()) {
      return this._root;
    }

    let current: ValueNode | undefined = this._root;

    for (const segment of path.segments()) {
      if (!current) {
        return undefined;
      }

      current = this.resolveSegment(current, segment);
    }

    return current;
  }

  private resolveSegment(
    node: ValueNode,
    segment: PathSegment,
  ): ValueNode | undefined {
    if (segment.type === 'property' && node.isObject()) {
      return node.child(segment.name);
    }
    if (segment.type === 'index' && node.isArray()) {
      return node.at(segment.index);
    }
    return undefined;
  }

  pathOf(nodeOrId: ValueNode | string): Path {
    const node =
      typeof nodeOrId === 'string' ? this.nodeById(nodeOrId) : nodeOrId;
    if (!node) {
      return Path.empty();
    }
    return this.index.pathOf(node);
  }

  get allErrors(): readonly Diagnostic[] {
    return this._root.errors;
  }

  get allWarnings(): readonly Diagnostic[] {
    return this._root.warnings;
  }

  get allDiagnostics(): readonly Diagnostic[] {
    return [...this.allErrors, ...this.allWarnings];
  }

  get isValid(): boolean {
    return this.allErrors.length === 0;
  }

  get hasDiagnostics(): boolean {
    return this.allDiagnostics.length > 0;
  }

  get errorsByPath(): ReadonlyMap<string, readonly Diagnostic[]> {
    const map = new Map<string, Diagnostic[]>();
    for (const error of this.allErrors) {
      const list = map.get(error.path) ?? [];
      list.push(error);
      map.set(error.path, list);
    }
    return map;
  }

  getValue(path: string): unknown {
    return this.get(path)?.getPlainValue();
  }

  setValue(path: string, value: unknown): void {
    const parsedPath = Path.fromString(path);
    const node = this.getByPath(parsedPath);
    if (!node) {
      throw new Error(`Path not found: ${path}`);
    }
    if (!node.isPrimitive()) {
      throw new Error(`Cannot set value on non-primitive node: ${path}`);
    }

    const oldValue = node.value;
    node.setValue(value);

    this.changeTracker.track({
      type: 'setValue',
      path: parsedPath,
      value,
      oldValue,
    });
  }

  getPlainValue(): unknown {
    return this._root.getPlainValue();
  }

  get changes(): readonly Change[] {
    return this.changeTracker.changes;
  }

  get hasChanges(): boolean {
    return this.changeTracker.hasChanges;
  }

  clearChanges(): void {
    this.changeTracker.clear();
  }

  getPatches(): readonly JsonPatch[] {
    return this.changeTracker.toPatches();
  }

  trackChange(change: Change): void {
    this.changeTracker.track(change);
  }

  rebuildIndex(): void {
    this.index.rebuild();
  }

  invalidatePathsUnder(node: ValueNode): void {
    this.index.invalidatePathsUnder(node);
  }

  get isDirty(): boolean {
    const root = this._root as unknown as DirtyTrackable;
    if ('isDirty' in root) {
      return root.isDirty;
    }
    return false;
  }

  commit(): void {
    const root = this._root as unknown as DirtyTrackable;
    if ('commit' in root && typeof root.commit === 'function') {
      root.commit();
    }
    this.changeTracker.clear();
  }

  revert(): void {
    const root = this._root as unknown as DirtyTrackable;
    if ('revert' in root && typeof root.revert === 'function') {
      root.revert();
    }
    this.changeTracker.clear();
  }

  setFormulaEngine(engine: FormulaEngine): void {
    this._formulaEngine = engine;
  }

  get formulaEngine(): FormulaEngine | null {
    return this._formulaEngine;
  }

  dispose(): void {
    this._formulaEngine?.dispose();
    this._formulaEngine = null;
  }
}
