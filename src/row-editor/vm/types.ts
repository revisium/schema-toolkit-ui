import type { ValueNode } from '@revisium/schema-toolkit';

export interface MenuItem {
  value: string;
  label?: string;
  handler?: () => Promise<void> | void;
  children?: MenuItem[];
  beforeSeparator?: boolean;
  afterSeparator?: boolean;
}

export type NodeRendererType = 'string' | 'number' | 'boolean' | 'container';

export interface EditorContext {
  readonly isReadOnly: boolean;
}

export interface NodeVM {
  readonly id: string;
  readonly name: string;
  readonly testId: string;
  readonly node: ValueNode;
  readonly parent: NodeVM | null;
  readonly editorContext: EditorContext | null;
  readonly depth: number;
  readonly guides: boolean[];
  readonly isCollapsible: boolean;
  readonly menu: MenuItem[];
  readonly formula: string | undefined;
  readonly rendererType: NodeRendererType;
  readonly isContainer: boolean;
  readonly childNodes: readonly NodeVM[];
  readonly showChildren: boolean;
  readonly isEditorReadOnly: boolean;

  isExpanded: boolean;
  isFocused: boolean;

  expand(): void;
  collapse(): void;
  toggleExpanded(): void;
  setFocused(focused: boolean): void;

  isPrimitive(): this is PrimitiveNodeVM;
  isObject(): this is ObjectNodeVM;
  isArray(): this is ArrayNodeVM;
}

export interface PrimitiveNodeVM extends NodeVM {
  readonly value: string | number | boolean;
  readonly defaultValue: string | number | boolean;
  readonly isReadOnly: boolean;
  readonly isFieldReadOnly: boolean;
  readonly isDirty: boolean;
  readonly isLongText: boolean;
  readonly collapsedLabel: string;

  setValue(value: unknown): void;
}

export interface ObjectNodeVM extends NodeVM {
  readonly children: readonly NodeVM[];
  readonly isDirty: boolean;
  readonly collapsedLabel: string;

  child(name: string): NodeVM | undefined;
}

export interface ArrayNodeVM extends NodeVM {
  readonly items: readonly NodeVM[];
  readonly length: number;
  readonly isDirty: boolean;
  readonly showAddButton: boolean;
  readonly collapsedLabel: string;

  at(index: number): NodeVM | undefined;
  pushValue(value: unknown): void;
  removeAt(index: number): void;
  move(fromIndex: number, toIndex: number): void;
}
