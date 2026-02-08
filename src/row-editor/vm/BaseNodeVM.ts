import { makeObservable, observable, action, computed } from 'mobx';
import type { ValueNode } from '@revisium/schema-toolkit';
import type {
  NodeVM,
  PrimitiveNodeVM,
  ObjectNodeVM,
  ArrayNodeVM,
  MenuItem,
  NodeRendererType,
  EditorContext,
} from './types';

export abstract class BaseNodeVM implements NodeVM {
  protected _isExpanded = true;
  protected _isFocused = false;
  public additionalMenu: MenuItem[] = [];

  constructor(
    public readonly node: ValueNode,
    public readonly parent: NodeVM | null,
    public readonly editorContext: EditorContext | null = null,
  ) {
    makeObservable<BaseNodeVM, '_isExpanded' | '_isFocused'>(this, {
      _isExpanded: observable,
      _isFocused: observable,
      additionalMenu: observable,
      isExpanded: computed,
      isFocused: computed,
      menu: computed,
      rendererType: computed,
      isContainer: computed,
      childNodes: computed,
      showChildren: computed,
      isEditorReadOnly: computed,
      expand: action,
      collapse: action,
      toggleExpanded: action,
      setFocused: action,
    });
  }

  get id(): string {
    return this.node.id;
  }

  get name(): string {
    return this.node.name;
  }

  get testId(): string {
    if (!this.parent) {
      return 'root';
    }
    const parentId = this.parent.testId;
    if (parentId === 'root' && this.parent.isObject()) {
      return this.name;
    }
    return `${parentId}-${this.name}`;
  }

  get depth(): number {
    let d = 0;
    let current: NodeVM | null = this.parent;
    while (current) {
      d++;
      current = current.parent;
    }
    return d;
  }

  get guides(): boolean[] {
    const result: boolean[] = [];
    let current: NodeVM | null = this.parent;
    while (current) {
      if (current.parent) {
        const siblings = this.getSiblings(current.parent);
        const isLastSibling = siblings.at(-1)?.id === current.id;
        result.unshift(!isLastSibling);
      }
      current = current.parent;
    }
    return result;
  }

  private getSiblings(parent: NodeVM): readonly NodeVM[] {
    if (parent.isObject()) {
      return parent.children;
    }
    if (parent.isArray()) {
      return parent.items;
    }
    return [];
  }

  get isCollapsible(): boolean {
    return false;
  }

  get formula(): string | undefined {
    if (this.node.isPrimitive()) {
      return this.node.formula?.expression;
    }
    return undefined;
  }

  get isCollapsibleTree(): boolean {
    return (
      this.isCollapsible || this.getChildren().some((c) => c.isCollapsible)
    );
  }

  protected getChildren(): readonly NodeVM[] {
    if (this.isObject()) {
      return this.children;
    }
    if (this.isArray()) {
      return this.items;
    }
    return [];
  }

  get rendererType(): NodeRendererType {
    if (this.isObject() || this.isArray()) {
      return 'container';
    }
    if (this.isPrimitive()) {
      const value = this.value;
      if (typeof value === 'boolean') {
        return 'boolean';
      }
      if (typeof value === 'number') {
        return 'number';
      }
    }
    return 'string';
  }

  get isContainer(): boolean {
    return this.isObject() || this.isArray();
  }

  get childNodes(): readonly NodeVM[] {
    return this.getChildren();
  }

  get showChildren(): boolean {
    return this.isContainer && this.isExpanded && this.childNodes.length > 0;
  }

  get isEditorReadOnly(): boolean {
    return this.editorContext?.isReadOnly ?? false;
  }

  protected get topMenu(): MenuItem[] {
    if (!this.isCollapsibleTree) {
      return [];
    }
    return [
      {
        value: 'expand',
        label: 'Expand',
        handler: () => this.expandAll(),
      },
      {
        value: 'collapse',
        label: 'Collapse',
        handler: () => this.collapseAll(),
        afterSeparator: true,
      },
    ];
  }

  get path(): string {
    const segments: string[] = [];
    let current: NodeVM | null = this as NodeVM;

    while (current) {
      const name = current.name;
      if (name) {
        const parent = current.parent;
        if (parent?.isArray()) {
          const currentId = current.id;
          const index = parent.items.findIndex((item) => item.id === currentId);
          segments.unshift(`[${index}]`);
        } else {
          segments.unshift(name);
        }
      }
      current = current.parent;
    }

    return segments.reduce((acc, seg) => {
      if (!acc) {
        return seg;
      }
      return seg.startsWith('[') ? `${acc}${seg}` : `${acc}.${seg}`;
    }, '');
  }

  protected get bottomMenu(): MenuItem[] {
    const copyChildren: MenuItem[] = [
      {
        value: 'json',
        label: 'json',
        handler: () => this.copyJson(),
      },
    ];

    if (this.path) {
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

  get menu(): MenuItem[] {
    return [...this.topMenu, ...this.additionalMenu, ...this.bottomMenu];
  }

  private async copyJson(): Promise<void> {
    const json = JSON.stringify(this.node.getPlainValue(), null, 2);
    await navigator.clipboard.writeText(json);
  }

  private async copyPath(): Promise<void> {
    await navigator.clipboard.writeText(this.path);
  }

  public expandAll(): void {
    this._isExpanded = true;
    for (const child of this.getChildren()) {
      if (child.isCollapsible) {
        (child as BaseNodeVM).expandAll();
      }
    }
  }

  public collapseAll(): void {
    this._isExpanded = false;
    for (const child of this.getChildren()) {
      if (child.isCollapsible) {
        (child as BaseNodeVM).collapseAll();
      }
    }
  }

  get isExpanded(): boolean {
    return this._isExpanded;
  }

  set isExpanded(value: boolean) {
    this._isExpanded = value;
  }

  get isFocused(): boolean {
    return this._isFocused;
  }

  expand(): void {
    this._isExpanded = true;
  }

  collapse(): void {
    this._isExpanded = false;
  }

  toggleExpanded(): void {
    this._isExpanded = !this._isExpanded;
  }

  setFocused(focused: boolean): void {
    this._isFocused = focused;
  }

  abstract isPrimitive(): this is PrimitiveNodeVM;
  abstract isObject(): this is ObjectNodeVM;
  abstract isArray(): this is ArrayNodeVM;
}
