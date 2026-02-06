import type { JsonObjectSchema } from '@revisium/schema-toolkit';
import { NodeAccessorFactory } from '../accessor';
import {
  SchemaEditorCore,
  type SchemaEditorCoreOptions,
} from './SchemaEditorCore';

export class SchemaEditorCoreFactory {
  constructor(private readonly _accessorFactory: NodeAccessorFactory) {}

  public create(
    jsonSchema: JsonObjectSchema,
    options: SchemaEditorCoreOptions = {},
  ): SchemaEditorCore {
    return new SchemaEditorCore(jsonSchema, options, this._accessorFactory);
  }
}
