import { makeObservable, observable, computed, action } from 'mobx';
import { getLabelByRef } from '../types';
import { NodeType, type SchemaNode, type FormulaDependent } from '../model';
import type { SchemaEditorVM } from './SchemaEditorVM';

export abstract class BaseNodeVM {
  public isFocusedState = false;
  public isMenuOpenState = false;
  public isSettingsOpenState = false;

  constructor(
    protected readonly _node: SchemaNode,
    protected readonly _editor: SchemaEditorVM,
    protected readonly _isRoot: boolean = false,
    protected readonly _isReadonly: boolean = false,
  ) {
    makeObservable(this, {
      isFocusedState: observable,
      isMenuOpenState: observable,
      isSettingsOpenState: observable,
      nodeId: computed,
      name: computed,
      path: computed,
      type: computed,
      label: computed,
      isFocused: computed,
      isMenuOpen: computed,
      isSettingsOpen: computed,
      shouldApplyFieldStyles: computed,
      isCollapsible: computed,
      isObject: computed,
      isArray: computed,
      isPrimitive: computed,
      isString: computed,
      isNumber: computed,
      isBoolean: computed,
      showTypeSelector: computed,
      showMenu: computed,
      hasDescription: computed,
      isDeprecated: computed,
      description: computed,
      hasFormula: computed,
      formula: computed,
      formulaDependents: computed,
      canDelete: computed,
      deleteBlockedReason: computed,
      defaultValue: computed,
      defaultValueAsString: computed,
      validationError: computed,
      hasError: computed,
      errorMessage: computed,
      canDrag: computed,
      isValidDropTarget: computed,
      isReadonly: computed,
      setFocused: action.bound,
      setMenuOpen: action.bound,
      setSettingsOpen: action.bound,
      rename: action.bound,
      setDescription: action.bound,
      setDeprecated: action.bound,
      setFormula: action.bound,
      setDefault: action.bound,
      handleFieldBlur: action.bound,
    });
  }

  public get isReadonly(): boolean {
    return this._isReadonly;
  }

  public get node(): SchemaNode {
    return this._node;
  }

  public get nodeId(): string {
    return this._node.id();
  }

  public get isRoot(): boolean {
    return this._isRoot;
  }

  public get name(): string {
    if (this._isRoot) {
      return this._editor.tableId;
    }
    return this._node.name();
  }

  public get path(): string {
    return this._node.name();
  }

  public get type(): string {
    if (this._node.isRef()) {
      return 'ref';
    }
    return this._node.nodeType();
  }

  public get label(): string {
    if (this._node.isRef()) {
      const ref = this._node.ref();
      return getLabelByRef(ref) ?? ref;
    }
    if (this._node.isObject()) {
      return 'object';
    }
    if (this._node.isArray()) {
      return 'array';
    }
    return this._node.nodeType();
  }

  public get isFocused(): boolean {
    return this.isFocusedState;
  }

  public get isMenuOpen(): boolean {
    return this.isMenuOpenState;
  }

  public get isSettingsOpen(): boolean {
    return this.isSettingsOpenState;
  }

  public get shouldApplyFieldStyles(): boolean {
    return (
      !this.isFocusedState && !this.isMenuOpenState && !this.isSettingsOpenState
    );
  }

  public setFocused(value: boolean): void {
    this.isFocusedState = value;
  }

  public setMenuOpen(value: boolean): void {
    this.isMenuOpenState = value;
  }

  public setSettingsOpen(value: boolean): void {
    this.isSettingsOpenState = value;
  }

  public get isCollapsible(): boolean {
    return false;
  }

  public get isObject(): boolean {
    return this._node.isObject();
  }

  public get isArray(): boolean {
    return this._node.isArray();
  }

  public get isPrimitive(): boolean {
    return this._node.isPrimitive();
  }

  public get isString(): boolean {
    return this._node.nodeType() === NodeType.String;
  }

  public get isNumber(): boolean {
    return this._node.nodeType() === NodeType.Number;
  }

  public get isBoolean(): boolean {
    return this._node.nodeType() === NodeType.Boolean;
  }

  public get showTypeSelector(): boolean {
    return !this._isReadonly;
  }

  public get showMenu(): boolean {
    return !this._isReadonly;
  }

  public get hasDescription(): boolean {
    return Boolean(this._node.metadata().description);
  }

  public get isDeprecated(): boolean {
    return this._node.metadata().deprecated ?? false;
  }

  public get description(): string {
    return this._node.metadata().description ?? '';
  }

  public get hasFormula(): boolean {
    return false;
  }

  public get formula(): string {
    return '';
  }

  public get formulaDependents(): FormulaDependent[] {
    return [];
  }

  public get canDelete(): boolean {
    return true;
  }

  public get deleteBlockedReason(): string | null {
    return null;
  }

  public get defaultValue(): unknown {
    return undefined;
  }

  public get defaultValueAsString(): string {
    return '';
  }

  public get validationError(): string | null {
    if (this._isRoot && this._editor.tableIdError) {
      return this._editor.tableIdError;
    }
    const errors = this._editor.engine.validationErrors;
    const error = errors.find((e) => e.nodeId === this.nodeId);
    return error?.message ?? null;
  }

  public get hasError(): boolean {
    return this.validationError !== null;
  }

  public get errorMessage(): string | null {
    return this.validationError;
  }

  public get canDrag(): boolean {
    if (this._isReadonly || this._isRoot || !this._node.name()) {
      return false;
    }
    return this._editor.engine.hasValidDropTarget(this.nodeId);
  }

  public get isValidDropTarget(): boolean {
    return false;
  }

  public rename(newName: string): void {
    if (newName !== this.name) {
      if (this._isRoot) {
        this._editor.setTableId(newName);
      } else {
        this._editor.engine.renameNode(this.nodeId, newName);
      }
    }
  }

  public setDescription(value: string): void {
    this._editor.engine.updateNodeMetadata(this.nodeId, { description: value });
  }

  public setDeprecated(value: boolean): void {
    this._editor.engine.updateNodeMetadata(this.nodeId, { deprecated: value });
  }

  public setFormula(_expression: string): void {
    // Override in subclasses that support formulas
  }

  public setDefault(_value: string): void {
    // Override in subclasses that support default values
  }

  public handleFieldBlur(): void {
    this.setFocused(false);
    if (!this._node.name() && !this._isRoot) {
      this.removeSelf();
    }
  }

  public canAcceptDrop(fromNodeId: string): boolean {
    return this._editor.engine.canMoveNode(fromNodeId, this.nodeId);
  }

  public remove(): void {
    this.removeSelf();
  }

  public abstract removeSelf(): void;
  public abstract changeType(typeId: string): void;
}
