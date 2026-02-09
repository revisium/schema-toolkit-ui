import { makeAutoObservable } from 'mobx';
import type {
  ValueNode,
  ValueTreeLike,
  ForeignKeyValueNode,
} from '@revisium/schema-toolkit';
import { isForeignKeyValueNode } from '@revisium/schema-toolkit';
import type {
  NodeVM,
  PrimitiveNodeVM,
  ObjectNodeVM,
  ArrayNodeVM,
  ForeignKeyNodeVM,
  FileNodeVM,
  MenuItem,
  NodeRendererType,
  EditorContext,
  RowEditorCallbacks,
} from '../types';
import type { RowNodeState } from './RowNodeState';
import type { RowNodeMenu } from './RowNodeMenu';
import type { RowNodeLayout } from './RowNodeLayout';
import type { ChildResolver } from './ChildResolver';

type PrimitiveValue = string | number | boolean;

interface PrimitiveNode extends ValueNode {
  value: PrimitiveValue;
  defaultValue: PrimitiveValue;
  isReadOnly: boolean;
  setValue(value: unknown): void;
}

interface ArrayNode extends ValueNode {
  value: readonly ValueNode[];
  length: number;
  at(index: number): ValueNode | undefined;
  pushValue(value: unknown): void;
  removeAt(index: number): void;
  move(fromIndex: number, toIndex: number): void;
}

interface DirtyNode {
  isDirty: boolean;
}

export class RowNodeAccessor implements NodeVM {
  private _menu!: RowNodeMenu;
  private _layout!: RowNodeLayout;

  constructor(
    public readonly node: ValueNode,
    public readonly parent: RowNodeAccessor | null,
    private readonly _state: RowNodeState,
    private readonly _tree: ValueTreeLike,
    public readonly editorContext: EditorContext | null,
    private readonly _childResolver: ChildResolver,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setMenu(menu: RowNodeMenu): void {
    this._menu = menu;
  }

  setLayout(layout: RowNodeLayout): void {
    this._layout = layout;
  }

  // --- Identity ---

  get id(): string {
    return this.node.id;
  }

  get name(): string {
    return this.node.name;
  }

  get displayName(): string {
    if (this.parent) {
      return this.node.name;
    }
    return this._rootDisplayName();
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

  // --- Type guards ---

  isPrimitive(): this is PrimitiveNodeVM {
    return this.node.isPrimitive();
  }

  isObject(): this is ObjectNodeVM {
    return this.node.isObject();
  }

  isArray(): this is ArrayNodeVM {
    return this.node.isArray();
  }

  // --- State (delegated to RowNodeState) ---

  get isExpanded(): boolean {
    return this._state.isExpanded;
  }

  set isExpanded(value: boolean) {
    this._state.setExpanded(value);
  }

  get isFocused(): boolean {
    return this._state.isFocused;
  }

  expand(): void {
    this._state.setExpanded(true);
  }

  collapse(): void {
    this._state.setExpanded(false);
  }

  toggleExpanded(): void {
    this._state.toggleExpanded();
  }

  setFocused(focused: boolean): void {
    this._state.setFocused(focused);
  }

  // --- Layout (delegated to RowNodeLayout) ---

  get depth(): number {
    return this._layout.depth;
  }

  get guides(): boolean[] {
    return this._layout.guides;
  }

  get isCollapsible(): boolean {
    return this._layout.isCollapsible;
  }

  get isCollapsibleTree(): boolean {
    return this._layout.isCollapsibleTree;
  }

  get rendererType(): NodeRendererType {
    return this._layout.rendererType;
  }

  get isContainer(): boolean {
    return this._layout.isContainer;
  }

  get childNodes(): readonly NodeVM[] {
    return this._childResolver.getChildren(this);
  }

  get showChildren(): boolean {
    return this._layout.showChildren;
  }

  get collapsedLabel(): string {
    return this._layout.collapsedLabel;
  }

  get isLongText(): boolean {
    return this._layout.isLongText;
  }

  expandAll(): void {
    this._layout.expandAll();
  }

  collapseAll(): void {
    this._layout.collapseAll();
  }

  // --- Menu ---

  get menu(): MenuItem[] {
    return this._menu.menu;
  }

  // --- Misc ---

  get formula(): string | undefined {
    if (this.node.isPrimitive()) {
      return this.node.formula?.expression;
    }
    return undefined;
  }

  get isEditorReadOnly(): boolean {
    return this.editorContext?.isReadOnly ?? false;
  }

  get path(): string {
    return this._tree.pathOf(this.node).asString();
  }

  get isDirty(): boolean {
    return (this.node as unknown as DirtyNode).isDirty;
  }

  // --- Primitive ---

  get value(): PrimitiveValue {
    return (this.node as PrimitiveNode).value;
  }

  get defaultValue(): PrimitiveValue {
    return (this.node as PrimitiveNode).defaultValue;
  }

  get isReadOnly(): boolean {
    return (this.node as PrimitiveNode).isReadOnly;
  }

  get isFieldReadOnly(): boolean {
    return this.isReadOnly || this.isEditorReadOnly;
  }

  setValue(value: unknown): void {
    (this.node as PrimitiveNode).setValue(value);
  }

  // --- Object ---

  get children(): readonly NodeVM[] {
    if (!this.node.isObject()) {
      return [];
    }
    return this._childResolver.getChildren(this);
  }

  child(name: string): NodeVM | undefined {
    return (this.children as readonly RowNodeAccessor[]).find(
      (c) => c.name === name,
    );
  }

  // --- Array ---

  get items(): readonly NodeVM[] {
    if (!this.node.isArray()) {
      return [];
    }
    return this._childResolver.getChildren(this);
  }

  get length(): number {
    if (!this.node.isArray()) {
      return 0;
    }
    return (this.node as ArrayNode).length;
  }

  at(index: number): NodeVM | undefined {
    const allItems = this.items as readonly RowNodeAccessor[];
    if (index < 0 || index >= allItems.length) {
      return undefined;
    }
    return allItems[index];
  }

  pushValue(value: unknown): void {
    (this.node as ArrayNode).pushValue(value);
  }

  removeAt(index: number): void {
    (this.node as ArrayNode).removeAt(index);
  }

  move(fromIndex: number, toIndex: number): void {
    (this.node as ArrayNode).move(fromIndex, toIndex);
  }

  insertAt(index: number): void {
    (this.node as ArrayNode).pushValue(null);
    const lastIndex = this.length - 1;
    if (index < lastIndex) {
      (this.node as ArrayNode).move(lastIndex, index);
    }
  }

  get showAddButton(): boolean {
    return this.isExpanded && !this.isEditorReadOnly;
  }

  // --- ForeignKey ---

  isForeignKey(): this is ForeignKeyNodeVM {
    return isForeignKeyValueNode(this.node);
  }

  get foreignKeyTableId(): string {
    return (this.node as unknown as ForeignKeyValueNode).foreignKey;
  }

  // --- File ---

  isFile(): this is FileNodeVM {
    return this.rendererType === 'file';
  }

  get fileStatus(): string {
    return this._getFileChildValue('status', '');
  }

  get fileId(): string {
    return this._getFileChildValue('fileId', '');
  }

  get fileUrl(): string {
    return this._getFileChildValue('url', '');
  }

  get fileMimeType(): string {
    return this._getFileChildValue('mimeType', '');
  }

  get fileWidth(): number {
    return this._getFileChildNumericValue('width');
  }

  get fileHeight(): number {
    return this._getFileChildNumericValue('height');
  }

  // --- Callbacks ---

  get callbacks(): RowEditorCallbacks | null {
    return this.editorContext?.callbacks ?? null;
  }

  // --- Internal ---

  getChildAccessors(): readonly RowNodeAccessor[] {
    return this._childResolver.getChildren(this);
  }

  // --- Private helpers ---

  private _getFileChildValue(name: string, fallback: string): string {
    if (!this.node.isObject()) {
      return fallback;
    }
    const child = this.node.child(name);
    if (child?.isPrimitive()) {
      return String(child.value);
    }
    return fallback;
  }

  private _rootDisplayName(): string {
    const schema = this.node.schema;
    if (!('type' in schema)) {
      return this.node.name;
    }
    return `<${schema.type}>`;
  }

  private _getFileChildNumericValue(name: string): number {
    if (!this.node.isObject()) {
      return 0;
    }
    const child = this.node.child(name);
    if (child?.isPrimitive()) {
      return Number(child.value) || 0;
    }
    return 0;
  }
}
