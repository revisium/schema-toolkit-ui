import type { SchemaNode } from '../node/SchemaNode';
import type { SchemaTree } from '../tree/SchemaTree';
import type { JsonSchemaType, JsonObjectSchema } from '../schema/JsonSchema';

export class SchemaNavigator {
  constructor(private readonly tree: SchemaTree) {}

  public findNodeByPath(path: string): SchemaNode | null {
    const parts = path.split('/').filter(Boolean);
    let current: SchemaNode = this.tree.root();
    let i = 0;

    while (i < parts.length) {
      if (current.isNull()) {
        return null;
      }

      const part = parts[i];
      if (part === undefined) {
        return null;
      }
      const nextNode = this.navigateToNextNode(current, part, parts[i + 1]);

      if (nextNode === null) {
        return null;
      }

      current = nextNode;
      i += part === 'properties' ? 2 : 1;
    }

    return current.isNull() ? null : current;
  }

  public getSchemaAtPath(
    baseSchema: JsonObjectSchema,
    path: string,
  ): JsonSchemaType | null {
    const parts = path.split('/').filter(Boolean);
    let current: JsonSchemaType = baseSchema;
    let index = 0;

    while (index < parts.length) {
      const part = parts[index];
      if (part === undefined) {
        return null;
      }
      const nextSchema = this.navigateToNextSchema(
        current,
        part,
        parts[index + 1],
      );

      if (nextSchema === null) {
        return null;
      }

      current = nextSchema;
      index += part === 'properties' ? 2 : 1;
    }

    return current;
  }

  public getTopLevelPath(path: string): string | null {
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[0] === 'properties') {
      return `/properties/${parts[1]}`;
    }
    return null;
  }

  public isTopLevelProperty(path: string): boolean {
    const parts = path.split('/').filter(Boolean);
    return parts.length === 2 && parts[0] === 'properties';
  }

  public buildChildPath(parentPath: string, childName: string): string {
    return parentPath
      ? `${parentPath}/properties/${childName}`
      : `/properties/${childName}`;
  }

  private navigateToNextNode(
    current: SchemaNode,
    part: string,
    nextPart: string | undefined,
  ): SchemaNode | null {
    if (part === 'properties') {
      if (!nextPart || !current.isObject()) {
        return null;
      }
      const child = current.children().find((c) => c.name() === nextPart);
      return child ?? null;
    }

    if (part === 'items') {
      if (!current.isArray()) {
        return null;
      }
      return current.items();
    }

    return current;
  }

  private navigateToNextSchema(
    current: JsonSchemaType,
    part: string,
    nextPart: string | undefined,
  ): JsonSchemaType | null {
    if (part === 'properties') {
      if (!nextPart || !('properties' in current) || !current.properties) {
        return null;
      }
      return current.properties[nextPart] ?? null;
    }

    if (part === 'items') {
      if (!('items' in current) || !current.items) {
        return null;
      }
      return current.items;
    }

    return current;
  }
}
