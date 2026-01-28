import type { SchemaNode } from '../node/SchemaNode';
import type { Path, PathSegment } from '../path';
import type { JsonSchemaType, JsonObjectSchema } from '../schema/JsonSchema';
import { NULL_NODE } from '../node/NullNode';

export class TreeNavigator {
  static navigateNode(root: SchemaNode, path: Path): SchemaNode {
    if (path.isEmpty()) {
      return root;
    }

    let current: SchemaNode = root;
    for (const segment of path.segments()) {
      current = TreeNavigator.navigateSegment(current, segment);
      if (current.isNull()) {
        return NULL_NODE;
      }
    }
    return current;
  }

  static navigateSchema(
    schema: JsonObjectSchema,
    path: Path,
  ): JsonSchemaType | null {
    if (path.isEmpty()) {
      return schema;
    }

    let current: JsonSchemaType = schema;
    for (const segment of path.segments()) {
      const next = TreeNavigator.navigateSchemaSegment(current, segment);
      if (next === null) {
        return null;
      }
      current = next;
    }
    return current;
  }

  private static navigateSegment(
    node: SchemaNode,
    segment: PathSegment,
  ): SchemaNode {
    if (segment.isProperty()) {
      if (!node.isObject()) {
        return NULL_NODE;
      }
      return node.property(segment.propertyName());
    }

    if (segment.isItems()) {
      if (!node.isArray()) {
        return NULL_NODE;
      }
      return node.items();
    }

    return NULL_NODE;
  }

  private static navigateSchemaSegment(
    schema: JsonSchemaType,
    segment: PathSegment,
  ): JsonSchemaType | null {
    if (segment.isProperty()) {
      if (!('properties' in schema) || !schema.properties) {
        return null;
      }
      return schema.properties[segment.propertyName()] ?? null;
    }

    if (segment.isItems()) {
      if (!('items' in schema) || !schema.items) {
        return null;
      }
      return schema.items;
    }

    return null;
  }
}
