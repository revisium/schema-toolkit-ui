import type { JsonSchemaType } from '../schema/JsonSchema';
import type {
  DefaultValueType,
  MetadataChangeType,
  MetadataChangesResult,
} from './RichPatchTypes';

interface SchemaWithFormula {
  'x-formula'?: { version: number; expression: string };
  readOnly?: boolean;
}

interface ArraySchemaWithItems {
  type: 'array';
  items: JsonSchemaType;
}

function isArraySchemaWithItems(
  schema: JsonSchemaType | null,
): schema is ArraySchemaWithItems {
  return (
    schema !== null &&
    typeof schema === 'object' &&
    'type' in schema &&
    schema.type === 'array' &&
    'items' in schema &&
    schema.items != null
  );
}

function isPrimitiveSchema(schema: JsonSchemaType | null): boolean {
  if (!schema || typeof schema !== 'object') {
    return false;
  }
  if ('type' in schema) {
    const type = schema.type;
    return type === 'string' || type === 'number' || type === 'boolean';
  }
  return false;
}

export class SchemaMetadataExtractor {
  public getSchemaType(schema: JsonSchemaType | null): string {
    if (!schema) {
      return 'unknown';
    }
    if ('$ref' in schema) {
      return schema.$ref;
    }
    if ('type' in schema) {
      if (schema.type === 'array' && 'items' in schema && schema.items) {
        const itemsType = this.getSchemaType(schema.items);
        return `array<${itemsType}>`;
      }
      return schema.type as string;
    }
    return 'unknown';
  }

  public getFormulaExpression(
    schema: JsonSchemaType | null,
  ): string | undefined {
    if (!schema || typeof schema !== 'object') {
      return undefined;
    }
    const s = schema as SchemaWithFormula;
    if (s['x-formula']?.expression) {
      return s['x-formula'].expression;
    }
    return undefined;
  }

  public getDefaultValue(schema: JsonSchemaType | null): DefaultValueType {
    if (!schema || typeof schema !== 'object') {
      return undefined;
    }
    if ('default' in schema) {
      const def = (schema as { default?: unknown }).default;
      if (
        typeof def === 'string' ||
        typeof def === 'number' ||
        typeof def === 'boolean'
      ) {
        return def;
      }
    }
    return undefined;
  }

  public getDescription(schema: JsonSchemaType | null): string | undefined {
    if (!schema || typeof schema !== 'object') {
      return undefined;
    }
    return (schema as { description?: string }).description;
  }

  public getDeprecated(schema: JsonSchemaType | null): boolean | undefined {
    if (!schema || typeof schema !== 'object') {
      return undefined;
    }
    return (schema as { deprecated?: boolean }).deprecated;
  }

  public getForeignKey(schema: JsonSchemaType | null): string | undefined {
    if (!schema || typeof schema !== 'object') {
      return undefined;
    }
    return (schema as { foreignKey?: string }).foreignKey;
  }

  public computeMetadataChanges(
    baseSchema: JsonSchemaType | null,
    currentSchema: JsonSchemaType | null,
  ): MetadataChangesResult {
    const changes: MetadataChangeType[] = [];
    let formulaChange: MetadataChangesResult['formulaChange'];
    let defaultChange: MetadataChangesResult['defaultChange'];
    let descriptionChange: MetadataChangesResult['descriptionChange'];
    let deprecatedChange: MetadataChangesResult['deprecatedChange'];

    const effectiveCurrentSchema = this.getEffectiveSchemaForComparison(
      baseSchema,
      currentSchema,
    );

    const baseDesc = this.getDescription(baseSchema);
    const currentDesc = this.getDescription(effectiveCurrentSchema);
    if (baseDesc !== currentDesc) {
      changes.push('description');
      descriptionChange = {
        fromDescription: baseDesc,
        toDescription: currentDesc,
      };
    }

    const baseDeprecated = this.getDeprecated(baseSchema);
    const currentDeprecated = this.getDeprecated(effectiveCurrentSchema);
    if (baseDeprecated !== currentDeprecated) {
      changes.push('deprecated');
      deprecatedChange = {
        fromDeprecated: baseDeprecated,
        toDeprecated: currentDeprecated,
      };
    }

    const baseFormula = this.getFormulaExpression(baseSchema);
    const currentFormula = this.getFormulaExpression(effectiveCurrentSchema);
    if (baseFormula !== currentFormula) {
      changes.push('formula');
      formulaChange = { fromFormula: baseFormula, toFormula: currentFormula };
    }

    const baseForeignKey = this.getForeignKey(baseSchema);
    const currentForeignKey = this.getForeignKey(effectiveCurrentSchema);
    if (baseForeignKey !== currentForeignKey) {
      changes.push('foreignKey');
    }

    const baseDefault = this.getDefaultValue(baseSchema);
    const currentDefault = this.getDefaultValue(effectiveCurrentSchema);
    if (baseDefault !== currentDefault) {
      changes.push('default');
      defaultChange = { fromDefault: baseDefault, toDefault: currentDefault };
    }

    return {
      metadataChanges: changes,
      formulaChange,
      defaultChange,
      descriptionChange,
      deprecatedChange,
    };
  }

  private getEffectiveSchemaForComparison(
    baseSchema: JsonSchemaType | null,
    currentSchema: JsonSchemaType | null,
  ): JsonSchemaType | null {
    if (
      isPrimitiveSchema(baseSchema) &&
      isArraySchemaWithItems(currentSchema)
    ) {
      return currentSchema.items;
    }
    return currentSchema;
  }

  public hasTypeChanged(
    baseSchema: JsonSchemaType | null,
    currentSchema: JsonSchemaType | null,
  ): boolean {
    const baseType = this.getSchemaType(baseSchema);
    const currentType = this.getSchemaType(currentSchema);
    return baseType !== currentType;
  }
}
