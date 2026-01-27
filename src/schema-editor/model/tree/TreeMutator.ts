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

    const isLastSegment = index === segments.length - 1;

    if (segment.isProperty()) {
      this.removePropertySegment(
        current,
        segment.propertyName(),
        segments,
        index,
        isLastSegment,
      );
    } else if (segment.isItems()) {
      this.removeItemsSegment(current, segments, index, isLastSegment);
    }
  }

  private removePropertySegment(
    current: SchemaNode,
    childName: string,
    segments: readonly PathSegment[],
    index: number,
    isLastSegment: boolean,
  ): void {
    if (isLastSegment) {
      current.removeChild(childName);
      return;
    }

    const existingChild = current.child(childName);
    if (!existingChild.isNull()) {
      this.removeNodeAtInternal(existingChild, segments, index + 1);
    }
  }

  private removeItemsSegment(
    current: SchemaNode,
    segments: readonly PathSegment[],
    index: number,
    isLastSegment: boolean,
  ): void {
    if (isLastSegment) {
      current.setItems(NULL_NODE);
      return;
    }

    const existingItems = current.items();
    if (!existingItems.isNull()) {
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

    const isLastSegment = index === segments.length - 1;

    if (segment.isProperty()) {
      this.updatePropertySegment(
        current,
        segment.propertyName(),
        segments,
        index,
        newNode,
        isLastSegment,
      );
    } else if (segment.isItems()) {
      this.updateItemsSegment(current, segments, index, newNode, isLastSegment);
    }
  }

  private updatePropertySegment(
    current: SchemaNode,
    childName: string,
    segments: readonly PathSegment[],
    index: number,
    newNode: SchemaNode,
    isLastSegment: boolean,
  ): void {
    if (isLastSegment) {
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
    if (!existingChild.isNull()) {
      this.updateNodeAt(existingChild, segments, index + 1, newNode);
    }
  }

  private updateItemsSegment(
    current: SchemaNode,
    segments: readonly PathSegment[],
    index: number,
    newNode: SchemaNode,
    isLastSegment: boolean,
  ): void {
    if (isLastSegment) {
      current.setItems(newNode);
      return;
    }

    const existingItems = current.items();
    if (!existingItems.isNull()) {
      this.updateNodeAt(existingItems, segments, index + 1, newNode);
    }
  }
}
