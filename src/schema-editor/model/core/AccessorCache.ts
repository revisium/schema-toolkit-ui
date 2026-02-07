import type { SchemaModel } from '@revisium/schema-toolkit';
import {
  NodeAccessor,
  NodeAccessorFactory,
  type NodeAccessorContext,
} from '../accessor';

export class AccessorCache {
  private readonly _cache = new Map<string, NodeAccessor>();

  constructor(
    private readonly _getSchemaModel: () => SchemaModel,
    private readonly _getContext: () => NodeAccessorContext,
    private readonly _accessorFactory: NodeAccessorFactory,
  ) {}

  public get(
    nodeId: string,
    isRoot: boolean = false,
    isReadonly: boolean = false,
  ): NodeAccessor {
    const cached = this._cache.get(nodeId);
    if (cached) {
      return cached;
    }

    const node = this._getSchemaModel().nodeById(nodeId);
    const accessor = this._accessorFactory.create(
      node,
      this._getContext(),
      isRoot,
      isReadonly,
    );
    this._cache.set(nodeId, accessor);
    return accessor;
  }

  public getChildren(
    parentNodeId: string,
    parentIsReadonly: boolean = false,
  ): NodeAccessor[] {
    const parentNode = this._getSchemaModel().nodeById(parentNodeId);
    if (parentNode.isNull()) {
      return [];
    }

    const childrenReadonly = parentIsReadonly || parentNode.isRef();

    if (parentNode.isObject()) {
      return parentNode
        .properties()
        .map((child) => this.get(child.id(), false, childrenReadonly));
    }

    if (parentNode.isArray()) {
      const items = parentNode.items();
      if (!items.isNull()) {
        return [this.get(items.id(), false, childrenReadonly)];
      }
    }

    return [];
  }

  public delete(nodeId: string): void {
    this._cache.delete(nodeId);
  }

  public clear(): void {
    this._cache.clear();
  }

  public entries(): IterableIterator<[string, NodeAccessor]> {
    return this._cache.entries();
  }
}
