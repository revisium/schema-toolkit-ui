import { makeObservable, computed, observable } from 'mobx';
import type { ValueNode } from '@revisium/schema-toolkit';
import { BaseNodeVM } from './BaseNodeVM';
import { createNodeVM } from './createNodeVM';
import type {
  NodeVM,
  PrimitiveNodeVM,
  ObjectNodeVM as IObjectNodeVM,
  ArrayNodeVM,
  EditorContext,
} from './types';

interface ObjectNode extends ValueNode {
  children: readonly ValueNode[];
  child(name: string): ValueNode | undefined;
  isDirty: boolean;
}

export class ObjectNodeVM extends BaseNodeVM implements IObjectNodeVM {
  private _children: NodeVM[] = [];

  constructor(
    node: ValueNode,
    parent: NodeVM | null,
    editorContext: EditorContext | null = null,
  ) {
    super(node, parent, editorContext);
    this.buildChildren();
    makeObservable<ObjectNodeVM, '_children'>(this, {
      _children: observable.shallow,
      children: computed,
      isDirty: computed,
      collapsedLabel: computed,
    });
  }

  private get objectNode(): ObjectNode {
    return this.node as ObjectNode;
  }

  private buildChildren(): void {
    const nodeChildren = this.objectNode.children;
    this._children = nodeChildren.map((childNode) =>
      createNodeVM(childNode, this),
    );
  }

  get children(): readonly NodeVM[] {
    return this._children;
  }

  child(name: string): NodeVM | undefined {
    return this._children.find((c) => c.name === name);
  }

  get isDirty(): boolean {
    return this.objectNode.isDirty;
  }

  get collapsedLabel(): string {
    const count = this._children.length;
    return `<${count} ${count === 1 ? 'key' : 'keys'}>`;
  }

  override get isCollapsible(): boolean {
    return this._children.length > 0;
  }

  isPrimitive(): this is PrimitiveNodeVM {
    return false;
  }

  isObject(): this is IObjectNodeVM {
    return true;
  }

  isArray(): this is ArrayNodeVM {
    return false;
  }
}
