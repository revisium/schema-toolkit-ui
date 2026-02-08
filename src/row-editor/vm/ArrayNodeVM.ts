import { makeObservable, computed, observable, action, override } from 'mobx';
import type { ValueNode } from '@revisium/schema-toolkit';
import { BaseNodeVM } from './BaseNodeVM';
import { createNodeVM } from './createNodeVM';
import type {
  NodeVM,
  PrimitiveNodeVM,
  ObjectNodeVM,
  ArrayNodeVM as IArrayNodeVM,
  MenuItem,
  EditorContext,
} from './types';

interface ArrayNode extends ValueNode {
  value: readonly ValueNode[];
  length: number;
  isDirty: boolean;
  at(index: number): ValueNode | undefined;
  pushValue(value: unknown): void;
  removeAt(index: number): void;
  move(fromIndex: number, toIndex: number): void;
}

export class ArrayNodeVM extends BaseNodeVM implements IArrayNodeVM {
  private _items: NodeVM[] = [];

  constructor(
    node: ValueNode,
    parent: NodeVM | null,
    editorContext: EditorContext | null = null,
  ) {
    super(node, parent, editorContext);
    this.buildItems();
    makeObservable<ArrayNodeVM, '_items'>(this, {
      _items: observable.shallow,
      items: computed,
      length: computed,
      isDirty: computed,
      showAddButton: computed,
      collapsedLabel: computed,
      menu: override,
      pushValue: action,
      removeAt: action,
      move: action,
      insertAt: action,
    });
  }

  private get arrayNode(): ArrayNode {
    return this.node as ArrayNode;
  }

  private buildItems(): void {
    const nodeItems = this.arrayNode.value;
    this._items = nodeItems.map((itemNode, index) => {
      const vm = createNodeVM(itemNode, this);
      this.updateItemMenu(vm as BaseNodeVM, index);
      return vm;
    });
  }

  private updateItemMenu(item: BaseNodeVM, index: number): void {
    const isFirst = index === 0;
    const isLast = index === this.length - 1;
    const hasMultipleItems = this.length > 1;

    const moveMenuItem = hasMultipleItems
      ? this.buildMoveMenuItem(index, isFirst, isLast)
      : null;

    item.additionalMenu = [
      ...(moveMenuItem ? [moveMenuItem] : []),
      {
        value: 'item',
        label: 'Item',
        children: [
          {
            value: 'add-before',
            label: 'Add before',
            handler: () => this.insertAt(index),
          },
          {
            value: 'add-after',
            label: 'Add after',
            handler: () => this.insertAt(index + 1),
          },
        ],
      },
      {
        value: 'delete',
        label: 'Delete',
        handler: () => this.removeAt(index),
        afterSeparator: true,
      },
    ];
  }

  private buildMoveMenuItem(
    index: number,
    isFirst: boolean,
    isLast: boolean,
  ): MenuItem {
    const moveChildren: MenuItem[] = [
      ...(this.length > 2 && index > 1
        ? [
            {
              value: 'move-to-start',
              label: 'to start',
              handler: () => this.move(index, 0),
            },
          ]
        : []),
      ...(!isFirst
        ? [
            {
              value: 'move-up',
              label: 'up',
              handler: () => this.move(index, index - 1),
            },
          ]
        : []),
      ...(!isLast
        ? [
            {
              value: 'move-down',
              label: 'down',
              handler: () => this.move(index, index + 1),
            },
          ]
        : []),
      ...(this.length > 2 && index < this.length - 2
        ? [
            {
              value: 'move-to-end',
              label: 'to end',
              handler: () => this.move(index, this.length - 1),
            },
          ]
        : []),
    ];

    return {
      value: 'move',
      label: 'Move',
      children: moveChildren,
    };
  }

  insertAt(index: number): void {
    this.arrayNode.pushValue(null);
    const lastIndex = this.length - 1;
    if (index < lastIndex) {
      this.arrayNode.move(lastIndex, index);
    }
    this.buildItems();
  }

  get items(): readonly NodeVM[] {
    return this._items;
  }

  get length(): number {
    return this.arrayNode.length;
  }

  at(index: number): NodeVM | undefined {
    if (index < 0 || index >= this._items.length) {
      return undefined;
    }
    return this._items[index];
  }

  pushValue(value: unknown): void {
    this.arrayNode.pushValue(value);
    this.buildItems();
  }

  removeAt(index: number): void {
    this.arrayNode.removeAt(index);
    this.buildItems();
  }

  move(fromIndex: number, toIndex: number): void {
    this.arrayNode.move(fromIndex, toIndex);
    this.buildItems();
  }

  get isDirty(): boolean {
    return this.arrayNode.isDirty;
  }

  get showAddButton(): boolean {
    return this.isExpanded && !this.isEditorReadOnly;
  }

  get collapsedLabel(): string {
    const count = this.length;
    return `<${count} ${count === 1 ? 'item' : 'items'}>`;
  }

  override get isCollapsible(): boolean {
    return this._items.length > 0;
  }

  override get menu(): MenuItem[] {
    const arrayMenu: MenuItem = {
      value: 'array',
      label: 'Array',
      children: [
        ...(this.length > 0
          ? [
              {
                value: 'add-first',
                label: 'Add item to start',
                handler: () => this.insertAt(0),
              },
            ]
          : []),
        {
          value: 'add-last',
          label: 'Add item to end',
          handler: () => this.pushValue(null),
        },
      ],
    };

    return [
      ...this.topMenu,
      arrayMenu,
      ...this.additionalMenu,
      ...this.bottomMenu,
    ];
  }

  isPrimitive(): this is PrimitiveNodeVM {
    return false;
  }

  isObject(): this is ObjectNodeVM {
    return false;
  }

  isArray(): this is IArrayNodeVM {
    return true;
  }
}
