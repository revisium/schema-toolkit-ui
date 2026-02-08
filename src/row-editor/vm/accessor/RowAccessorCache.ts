import { observable } from 'mobx';
import type { ValueNode } from '@revisium/schema-toolkit';
import type { RowNodeAccessor } from './RowNodeAccessor';
import type { RowAccessorFactory } from './RowAccessorFactory';
import type { ChildResolver } from './ChildResolver';

export class RowAccessorCache implements ChildResolver {
  private readonly _cache = observable.map<string, RowNodeAccessor>();

  constructor(private readonly _factory: RowAccessorFactory) {}

  getOrCreate(
    node: ValueNode,
    parent: RowNodeAccessor | null,
  ): RowNodeAccessor {
    const cached = this._cache.get(node.id);
    if (cached) {
      return cached;
    }
    const accessor = this._factory.create(node, parent, this);
    this._cache.set(node.id, accessor);
    return accessor;
  }

  getChildren(accessor: RowNodeAccessor): RowNodeAccessor[] {
    const node = accessor.node;

    if (node.isObject()) {
      const objectNode = node as ValueNode & {
        children: readonly ValueNode[];
      };
      return objectNode.children.map((childNode) =>
        this.getOrCreate(childNode, accessor),
      );
    }

    if (node.isArray()) {
      const arrayNode = node as ValueNode & {
        value: readonly ValueNode[];
      };
      return arrayNode.value.map((itemNode) =>
        this.getOrCreate(itemNode, accessor),
      );
    }

    return [];
  }

  clear(): void {
    this._cache.clear();
  }
}
