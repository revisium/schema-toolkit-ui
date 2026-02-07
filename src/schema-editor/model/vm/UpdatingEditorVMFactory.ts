import type { JsonObjectSchema } from '@revisium/schema-toolkit';
import { SchemaEditorCoreFactory } from '../core';
import {
  UpdatingEditorVM,
  type UpdatingEditorVMOptions,
} from './UpdatingEditorVM';

export class UpdatingEditorVMFactory {
  constructor(private readonly _coreFactory: SchemaEditorCoreFactory) {}

  public create(
    jsonSchema: JsonObjectSchema,
    options: UpdatingEditorVMOptions = {},
  ): UpdatingEditorVM {
    const core = this._coreFactory.create(jsonSchema, options);
    return new UpdatingEditorVM(core, options);
  }
}
