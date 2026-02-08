import { makeObservable, computed, action } from 'mobx';
import type { ValueNode } from '@revisium/schema-toolkit';
import { BaseNodeVM } from './BaseNodeVM';
import type {
  NodeVM,
  PrimitiveNodeVM as IPrimitiveNodeVM,
  ObjectNodeVM,
  ArrayNodeVM,
  EditorContext,
} from './types';

type PrimitiveValue = string | number | boolean;

const STRING_COLLAPSE_THRESHOLD = 64;

interface PrimitiveNode extends ValueNode {
  value: PrimitiveValue;
  defaultValue: PrimitiveValue;
  isReadOnly: boolean;
  isDirty: boolean;
  setValue(value: unknown): void;
}

export class PrimitiveNodeVM extends BaseNodeVM implements IPrimitiveNodeVM {
  constructor(
    node: ValueNode,
    parent: NodeVM | null,
    editorContext: EditorContext | null = null,
  ) {
    super(node, parent, editorContext);
    makeObservable(this, {
      value: computed,
      defaultValue: computed,
      isReadOnly: computed,
      isFieldReadOnly: computed,
      isDirty: computed,
      isLongText: computed,
      collapsedLabel: computed,
      setValue: action,
    });
  }

  private get primitiveNode(): PrimitiveNode {
    return this.node as PrimitiveNode;
  }

  get value(): PrimitiveValue {
    return this.primitiveNode.value;
  }

  get defaultValue(): PrimitiveValue {
    return this.primitiveNode.defaultValue;
  }

  get isReadOnly(): boolean {
    return this.primitiveNode.isReadOnly;
  }

  get isFieldReadOnly(): boolean {
    return this.isReadOnly || this.isEditorReadOnly;
  }

  get isDirty(): boolean {
    return this.primitiveNode.isDirty;
  }

  get isLongText(): boolean {
    if (typeof this.value !== 'string') {
      return false;
    }
    return this.value.length > STRING_COLLAPSE_THRESHOLD;
  }

  get collapsedLabel(): string {
    if (typeof this.value !== 'string') {
      return '';
    }
    const text = this.value;
    if (!text.trim()) {
      return '<empty text>';
    }
    const wordCount = text.trim().split(/\s+/).length;
    const word = wordCount === 1 ? 'word' : 'words';
    return `<text: ${wordCount} ${word}>`;
  }

  setValue(value: unknown): void {
    this.primitiveNode.setValue(value);
  }

  isPrimitive(): this is IPrimitiveNodeVM {
    return true;
  }

  isObject(): this is ObjectNodeVM {
    return false;
  }

  isArray(): this is ArrayNodeVM {
    return false;
  }
}
