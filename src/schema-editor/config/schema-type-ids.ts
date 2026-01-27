import { SystemSchemaIds, getLabelByRef } from '../types';
import { NodeFactory, type SchemaNode } from '../model';

export enum SchemaTypeIds {
  String = 'String',
  Number = 'Number',
  Boolean = 'Boolean',
  Object = 'Object',
  Array = 'Array',
  ForeignKeyString = 'ForeignKeyString',
  File = 'File',
  RowId = 'RowId',
  RowVersionId = 'RowVersionId',
  RowCreatedId = 'RowCreatedId',
  RowCreatedAt = 'RowCreatedAt',
  RowPublishedAt = 'RowPublishedAt',
  RowUpdatedAt = 'RowUpdatedAt',
  RowHash = 'RowHash',
  RowSchemaHash = 'RowSchemaHash',
  Markdown = 'Markdown',
}

export function createNodeByTypeId(
  typeId: SchemaTypeIds | string,
  name: string,
): SchemaNode | null {
  switch (typeId as SchemaTypeIds) {
    case SchemaTypeIds.String:
      return NodeFactory.string(name);
    case SchemaTypeIds.Number:
      return NodeFactory.number(name);
    case SchemaTypeIds.Boolean:
      return NodeFactory.boolean(name);
    case SchemaTypeIds.Object:
      return NodeFactory.object(name);
    case SchemaTypeIds.Array:
      return NodeFactory.array(name, NodeFactory.string(''));
    case SchemaTypeIds.ForeignKeyString:
      return NodeFactory.string(name, { foreignKey: '' });
    case SchemaTypeIds.File:
      return NodeFactory.ref(name, { $ref: SystemSchemaIds.File });
    case SchemaTypeIds.RowId:
      return NodeFactory.ref(name, { $ref: SystemSchemaIds.RowId });
    case SchemaTypeIds.RowVersionId:
      return NodeFactory.ref(name, { $ref: SystemSchemaIds.RowVersionId });
    case SchemaTypeIds.RowCreatedId:
      return NodeFactory.ref(name, { $ref: SystemSchemaIds.RowCreatedId });
    case SchemaTypeIds.RowCreatedAt:
      return NodeFactory.ref(name, { $ref: SystemSchemaIds.RowCreatedAt });
    case SchemaTypeIds.RowPublishedAt:
      return NodeFactory.ref(name, { $ref: SystemSchemaIds.RowPublishedAt });
    case SchemaTypeIds.RowUpdatedAt:
      return NodeFactory.ref(name, { $ref: SystemSchemaIds.RowUpdatedAt });
    case SchemaTypeIds.RowHash:
      return NodeFactory.ref(name, { $ref: SystemSchemaIds.RowHash });
    case SchemaTypeIds.RowSchemaHash:
      return NodeFactory.ref(name, { $ref: SystemSchemaIds.RowSchemaHash });
    case SchemaTypeIds.Markdown:
      return NodeFactory.string(name, { contentMediaType: 'text/markdown' });
    default:
      return null;
  }
}

type BaseOption = {
  id: string;
  label: string;
  type?: 'item' | 'submenu';
};

type MenuOptionItem =
  | (BaseOption & {
      type?: 'item';
      addDividerAfter?: boolean;
    })
  | (BaseOption & {
      type: 'submenu';
      items: MenuOptionItem[];
    });

type MenuGroup = {
  id: string;
  options: MenuOptionItem[];
  addDividerAfter?: boolean;
};

const typesOptions: MenuOptionItem[] = [
  { id: SchemaTypeIds.String, label: 'string' },
  { id: SchemaTypeIds.Number, label: 'number' },
  { id: SchemaTypeIds.Boolean, label: 'boolean' },
  { id: SchemaTypeIds.Object, label: 'object' },
  { id: SchemaTypeIds.Array, label: 'array' },
  { id: SchemaTypeIds.ForeignKeyString, label: 'foreign key' },
];

const schemasOptions: MenuOptionItem[] = [
  {
    id: 'schemas-submenu',
    label: 'Schemas',
    type: 'submenu',
    items: [
      { id: SchemaTypeIds.File, label: getLabelByRef(SystemSchemaIds.File) },
      { id: SchemaTypeIds.Markdown, label: 'Markdown' },
    ],
  },
];

const systemFieldsOptions: MenuOptionItem[] = [
  {
    id: 'system-fields-submenu',
    label: 'System fields',
    type: 'submenu',
    items: [
      { id: SchemaTypeIds.RowId, label: getLabelByRef(SystemSchemaIds.RowId) },
      {
        id: SchemaTypeIds.RowVersionId,
        label: getLabelByRef(SystemSchemaIds.RowVersionId),
      },
      {
        id: SchemaTypeIds.RowCreatedId,
        label: getLabelByRef(SystemSchemaIds.RowCreatedId),
        addDividerAfter: true,
      },
      {
        id: SchemaTypeIds.RowCreatedAt,
        label: getLabelByRef(SystemSchemaIds.RowCreatedAt),
      },
      {
        id: SchemaTypeIds.RowPublishedAt,
        label: getLabelByRef(SystemSchemaIds.RowPublishedAt),
      },
      {
        id: SchemaTypeIds.RowUpdatedAt,
        label: getLabelByRef(SystemSchemaIds.RowUpdatedAt),
        addDividerAfter: true,
      },
      {
        id: SchemaTypeIds.RowHash,
        label: getLabelByRef(SystemSchemaIds.RowHash),
      },
      {
        id: SchemaTypeIds.RowSchemaHash,
        label: getLabelByRef(SystemSchemaIds.RowSchemaHash),
      },
    ],
  },
];

export const typeMenuGroups: MenuGroup[] = [
  { id: 'types', options: typesOptions, addDividerAfter: true },
  { id: 'schemas', options: schemasOptions, addDividerAfter: true },
  { id: 'system-fields', options: systemFieldsOptions },
];

export type { MenuOptionItem, MenuGroup };
