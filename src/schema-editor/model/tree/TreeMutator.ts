import type { SchemaNode } from '../node/SchemaNode';
import type { Path } from '../path/Path';
import type { PathSegment } from '../path/PathSegment';
import { NULL_NODE } from '../node/NullNode';

export class TreeMutator {
  public setNodeAt(
    rootNode: SchemaNode,
    path: Path,
    newNode: SchemaNode,
  ): void {
    if (path.isEmpty()) {
      throw new Error('Cannot replace root node');
    }
    this.updateNodeAt(rootNode, path.segments(), 0, newNode);
  }

  public removeNodeAt(rootNode: SchemaNode, path: Path): void {
    if (path.isEmpty()) {
      throw new Error('Cannot remove root node');
    }
    this.removeNodeAtInternal(rootNode, path.segments(), 0);
  }

  public removeNodeAtInternal(
    current: SchemaNode,
    segments: readonly PathSegment[],
    index: number,
  ): void {
    const segment = segments[index];
    if (!segment) {
      return;
    }

    if (segment.isProperty()) {
      const childName = segment.propertyName();

      if (index === segments.length - 1) {
        current.removeChild(childName);
        return;
      }

      const existingChild = current.child(childName);
      if (existingChild.isNull()) {
        return;
      }

      this.removeNodeAtInternal(existingChild, segments, index + 1);
      return;
    }

    if (segment.isItems()) {
      if (index === segments.length - 1) {
        current.setItems(NULL_NODE);
        return;
      }

      const existingItems = current.items();
      if (existingItems.isNull()) {
        return;
      }

      this.removeNodeAtInternal(existingItems, segments, index + 1);
    }
  }

  private updateNodeAt(
    current: SchemaNode,
    segments: readonly PathSegment[],
    index: number,
    newNode: SchemaNode,
  ): void {
    if (index >= segments.length) {
      return;
    }

    const segment = segments[index];
    if (!segment) {
      return;
    }

    if (segment.isProperty()) {
      const childName = segment.propertyName();

      if (index === segments.length - 1) {
        newNode.setName(childName);
        const existingChild = current.child(childName);
        if (existingChild.isNull()) {
          current.addChild(newNode);
        } else {
          current.replaceChild(childName, newNode);
        }
        return;
      }

      const existingChild = current.child(childName);
      if (existingChild.isNull()) {
        return;
      }

      this.updateNodeAt(existingChild, segments, index + 1, newNode);
      return;
    }

    if (segment.isItems()) {
      if (index === segments.length - 1) {
        current.setItems(newNode);
        return;
      }

      const existingItems = current.items();
      if (existingItems.isNull()) {
        return;
      }

      this.updateNodeAt(existingItems, segments, index + 1, newNode);
    }
  }
}
