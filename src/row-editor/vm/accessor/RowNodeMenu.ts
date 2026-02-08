import { makeAutoObservable } from 'mobx';
import type { ValueNode } from '@revisium/schema-toolkit';
import type { MenuItem } from '../types';
import type { RowNodeAccessor } from './RowNodeAccessor';

interface ArrayItemContext {
  index: number;
  arrayLength: number;
  insertAt(index: number): void;
  removeAt(index: number): void;
  move(from: number, to: number): void;
}

export class RowNodeMenu {
  constructor(private readonly _accessor: RowNodeAccessor) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get menu(): MenuItem[] {
    return [
      ...this.topMenu,
      ...this.arrayOwnMenu,
      ...this.arrayItemMenu,
      ...this.bottomMenu,
    ];
  }

  private get arrayItemContext(): ArrayItemContext | null {
    const parent = this._accessor.parent;
    if (!parent || !parent.node.isArray()) {
      return null;
    }
    const arrayNode = parent.node as ValueNode & {
      value: readonly ValueNode[];
    };
    const index = arrayNode.value.indexOf(this._accessor.node);
    if (index === -1) {
      return null;
    }
    return {
      index,
      arrayLength: arrayNode.value.length,
      insertAt: (i: number) => parent.insertAt(i),
      removeAt: (i: number) => parent.removeAt(i),
      move: (from: number, to: number) => parent.move(from, to),
    };
  }

  private get topMenu(): MenuItem[] {
    if (!this._accessor.isCollapsibleTree) {
      return [];
    }
    return [
      {
        value: 'expand',
        label: 'Expand',
        handler: () => this._accessor.expandAll(),
      },
      {
        value: 'collapse',
        label: 'Collapse',
        handler: () => this._accessor.collapseAll(),
        afterSeparator: true,
      },
    ];
  }

  private get arrayOwnMenu(): MenuItem[] {
    if (!this._accessor.node.isArray()) {
      return [];
    }

    return [
      {
        value: 'array',
        label: 'Array',
        children: [
          ...(this._accessor.length > 0
            ? [
                {
                  value: 'add-first',
                  label: 'Add item to start',
                  handler: () => this._accessor.insertAt(0),
                },
              ]
            : []),
          {
            value: 'add-last',
            label: 'Add item to end',
            handler: () => this._accessor.pushValue(null),
          },
        ],
      },
    ];
  }

  private get arrayItemMenu(): MenuItem[] {
    const ctx = this.arrayItemContext;
    if (!ctx) {
      return [];
    }

    const moveMenuItem =
      ctx.arrayLength > 1 ? this.buildMoveMenuItem(ctx) : null;

    return [
      ...(moveMenuItem ? [moveMenuItem] : []),
      {
        value: 'item',
        label: 'Item',
        children: [
          {
            value: 'add-before',
            label: 'Add before',
            handler: () => ctx.insertAt(ctx.index),
          },
          {
            value: 'add-after',
            label: 'Add after',
            handler: () => ctx.insertAt(ctx.index + 1),
          },
        ],
      },
      {
        value: 'delete',
        label: 'Delete',
        handler: () => ctx.removeAt(ctx.index),
        afterSeparator: true,
      },
    ];
  }

  private buildMoveMenuItem(ctx: ArrayItemContext): MenuItem {
    const { index, arrayLength } = ctx;
    const isFirst = index === 0;
    const isLast = index === arrayLength - 1;

    const moveChildren: MenuItem[] = [
      ...(arrayLength > 2 && index > 1
        ? [
            {
              value: 'move-to-start',
              label: 'to start',
              handler: () => ctx.move(index, 0),
            },
          ]
        : []),
      ...(!isFirst
        ? [
            {
              value: 'move-up',
              label: 'up',
              handler: () => ctx.move(index, index - 1),
            },
          ]
        : []),
      ...(!isLast
        ? [
            {
              value: 'move-down',
              label: 'down',
              handler: () => ctx.move(index, index + 1),
            },
          ]
        : []),
      ...(arrayLength > 2 && index < arrayLength - 2
        ? [
            {
              value: 'move-to-end',
              label: 'to end',
              handler: () => ctx.move(index, arrayLength - 1),
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

  private get bottomMenu(): MenuItem[] {
    const copyChildren: MenuItem[] = [
      {
        value: 'json',
        label: 'json',
        handler: () => this.copyJson(),
      },
    ];

    const path = this._accessor.path;
    if (path) {
      copyChildren.push({
        value: 'path',
        label: 'path',
        handler: () => this.copyPath(),
      });
    }

    return [
      {
        value: 'copy',
        label: 'Copy',
        children: copyChildren,
      },
    ];
  }

  private async copyJson(): Promise<void> {
    const json = JSON.stringify(this._accessor.node.getPlainValue(), null, 2);
    await navigator.clipboard.writeText(json);
  }

  private async copyPath(): Promise<void> {
    await navigator.clipboard.writeText(this._accessor.path);
  }
}
