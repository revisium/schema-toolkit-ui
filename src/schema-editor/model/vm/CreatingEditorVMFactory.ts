import type { JsonObjectSchema } from '@revisium/schema-toolkit';
import { SchemaEditorCoreFactory } from '../core';
import {
  CreatingEditorVM,
  type CreatingEditorVMOptions,
} from './CreatingEditorVM';

export class CreatingEditorVMFactory {
  constructor(private readonly _coreFactory: SchemaEditorCoreFactory) {}

  public create(
    jsonSchema: JsonObjectSchema,
    options: CreatingEditorVMOptions = {},
  ): CreatingEditorVM {
    const core = this._coreFactory.create(jsonSchema, options);
    return new CreatingEditorVM(core, options);
  }
}
