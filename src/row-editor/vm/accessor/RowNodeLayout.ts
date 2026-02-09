import { makeAutoObservable } from 'mobx';
import type { NodeRendererType } from '../types';
import type { RowNodeAccessor } from './RowNodeAccessor';

const STRING_COLLAPSE_THRESHOLD = 64;

export class RowNodeLayout {
  constructor(private readonly _accessor: RowNodeAccessor) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get depth(): number {
    let d = 0;
    let current: RowNodeAccessor | null = this._accessor.parent;
    while (current) {
      d++;
      current = current.parent;
    }
    return d;
  }

  get guides(): boolean[] {
    const result: boolean[] = [];
    let current: RowNodeAccessor | null = this._accessor.parent;
    while (current) {
      if (current.parent) {
        const siblings = current.parent.getChildAccessors();
        const isLastSibling = siblings.at(-1)?.id === current.id;
        result.unshift(!isLastSibling);
      }
      current = current.parent;
    }
    return result;
  }

  get isCollapsible(): boolean {
    return this._accessor.getChildAccessors().length > 0;
  }

  get isCollapsibleTree(): boolean {
    return (
      this.isCollapsible ||
      this._accessor.getChildAccessors().some((c) => c.isCollapsible)
    );
  }

  get rendererType(): NodeRendererType {
    if (this._accessor.node.isObject() || this._accessor.node.isArray()) {
      return 'container';
    }
    if (this._accessor.node.isPrimitive()) {
      const v = this._accessor.value;
      if (typeof v === 'boolean') {
        return 'boolean';
      }
      if (typeof v === 'number') {
        return 'number';
      }
    }
    return 'string';
  }

  get isContainer(): boolean {
    return this._accessor.node.isObject() || this._accessor.node.isArray();
  }

  get showChildren(): boolean {
    return (
      this.isContainer &&
      this._accessor.isExpanded &&
      this._accessor.getChildAccessors().length > 0
    );
  }

  get collapsedLabel(): string {
    if (this._accessor.node.isPrimitive()) {
      return this.primitiveCollapsedLabel;
    }
    if (this._accessor.node.isObject()) {
      return formatCount(this._accessor.children.length, 'key', 'keys');
    }
    if (this._accessor.node.isArray()) {
      return formatCount(this._accessor.length, 'item', 'items');
    }
    return '';
  }

  private get primitiveCollapsedLabel(): string {
    const v = this._accessor.value;
    if (typeof v !== 'string') {
      return '';
    }
    if (!v.trim()) {
      return '<empty text>';
    }
    const wordCount = v.trim().split(/\s+/).length;
    return formatCount(wordCount, 'word', 'words', 'text: ');
  }

  get isLongText(): boolean {
    const v = this._accessor.value;
    return typeof v === 'string' && v.length > STRING_COLLAPSE_THRESHOLD;
  }

  expandAll(): void {
    this._accessor.expand();
    for (const child of this._accessor.getChildAccessors()) {
      if (child.isCollapsible) {
        child.expandAll();
      }
    }
  }

  collapseAll(): void {
    this._accessor.collapse();
    for (const child of this._accessor.getChildAccessors()) {
      if (child.isCollapsible) {
        child.collapseAll();
      }
    }
  }
}

function formatCount(
  count: number,
  singular: string,
  plural: string,
  prefix = '',
): string {
  return `<${prefix}${count} ${count === 1 ? singular : plural}>`;
}
