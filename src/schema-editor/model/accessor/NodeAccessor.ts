import { makeAutoObservable } from 'mobx';
import type { SchemaNode } from '@revisium/schema-toolkit';
import type { NodeState } from './NodeState';
import type { NodeLabel } from './NodeLabel';
import type { NodeFormula } from './NodeFormula';
import type { NodeValidation } from './NodeValidation';
import type { NodeActions } from './NodeActions';

export interface NodeAccessorDependencies {
  state: NodeState;
  label: NodeLabel;
  formula: NodeFormula;
  validation: NodeValidation;
  actions: NodeActions;
}

export class NodeAccessor {
  public readonly state: NodeState;
  public readonly label: NodeLabel;
  public readonly formula: NodeFormula;
  public readonly validation: NodeValidation;
  public readonly actions: NodeActions;

  constructor(
    private readonly _node: SchemaNode,
    deps: NodeAccessorDependencies,
    private readonly _isRoot: boolean = false,
    private readonly _isReadonly: boolean = false,
  ) {
    this.state = deps.state;
    this.label = deps.label;
    this.formula = deps.formula;
    this.validation = deps.validation;
    this.actions = deps.actions;

    makeAutoObservable(
      this,
      {
        state: false,
        label: false,
        formula: false,
        validation: false,
        actions: false,
      },
      { autoBind: true },
    );
  }

  public get nodeId(): string {
    return this._node.id();
  }

  public get isRoot(): boolean {
    return this._isRoot;
  }

  public get isReadonly(): boolean {
    return this._isReadonly;
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

  public get isRef(): boolean {
    return this._node.isRef();
  }

  public get ref(): string | undefined {
    if (this._node.isRef()) {
      return this._node.ref();
    }
    return undefined;
  }

  public get isForeignKey(): boolean {
    return this.label.isForeignKey;
  }

  public get defaultValue(): unknown {
    return this._node.defaultValue();
  }

  public get defaultValueAsString(): string {
    const value = this.defaultValue;
    if (value === undefined || value === null) {
      return '';
    }
    switch (typeof value) {
      case 'string':
        return value;
      case 'number':
      case 'boolean':
        return String(value);
      default:
        return JSON.stringify(value);
    }
  }

  public get hoverTargetClass(): string {
    return `hover-target-${this.nodeId}`;
  }

  public get shouldApplyFieldStyles(): boolean {
    return (
      !this.state.isFocused &&
      !this.state.isMenuOpen &&
      !this.state.isSettingsOpen
    );
  }

  public get showMenu(): boolean {
    return !this._isReadonly;
  }

  public handleFieldBlur(): void {
    this.state.setFocused(false);
    if (!this._node.name() && !this._isRoot) {
      this.actions.remove();
    }
  }
}
