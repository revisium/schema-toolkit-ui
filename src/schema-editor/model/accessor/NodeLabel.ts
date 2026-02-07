import { makeAutoObservable } from 'mobx';
import type { SchemaNode } from '@revisium/schema-toolkit';
import { getLabelByRef } from '../../config/schema-type-ids';

export class NodeLabel {
  constructor(
    private readonly _node: SchemaNode,
    private readonly _getTableId: () => string,
    private readonly _isRoot: boolean,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  public get name(): string {
    if (this._isRoot) {
      return this._getTableId();
    }
    return this._node.name();
  }

  public get nodeType(): string {
    return this._node.nodeType();
  }

  public get typeLabel(): string {
    if (this._node.isRef()) {
      return this.getRefLabel();
    }
    if (this._node.isObject()) {
      return 'object';
    }
    if (this._node.isArray()) {
      return 'array';
    }
    if (this._node.foreignKey() !== undefined) {
      return 'ForeignKey';
    }
    if (this._node.contentMediaType?.() === 'text/markdown') {
      return 'Markdown';
    }
    return this._node.nodeType();
  }

  public get description(): string | undefined {
    return this._node.metadata().description;
  }

  public get isDeprecated(): boolean {
    return this._node.metadata().deprecated ?? false;
  }

  public get foreignKeyTable(): string | undefined {
    return this._node.foreignKey();
  }

  public get isForeignKey(): boolean {
    return this._node.foreignKey() !== undefined;
  }

  private getRefLabel(): string {
    const ref = this._node.ref();
    if (!ref) {
      return 'Ref';
    }
    return getLabelByRef(ref);
  }
}
