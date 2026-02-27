import {
  SchemaParser,
  createSchemaModel,
  resetNodeIdCounter,
  SystemSchemaIds,
  obj,
  str,
  num,
  bool,
  arr,
  ref,
  strFormula,
  type JsonObjectSchema,
  type RefSchemas,
} from '@revisium/schema-toolkit';
import {
  fileSchema,
  rowIdSchema,
  rowCreatedAtSchema,
  rowCreatedIdSchema,
  rowVersionIdSchema,
  rowPublishedAtSchema,
  rowUpdatedAtSchema,
  rowHashSchema,
  rowSchemaHashSchema,
} from '@revisium/schema-toolkit';
import { FilterFieldType } from '../../../shared/field-types';
import { SystemFieldId } from '../../../shared/system-fields';
import { extractColumns } from '../extractColumns';

const defaultRefSchemas: RefSchemas = {
  [SystemSchemaIds.File]: fileSchema,
  [SystemSchemaIds.RowId]: rowIdSchema,
  [SystemSchemaIds.RowCreatedAt]: rowCreatedAtSchema,
  [SystemSchemaIds.RowCreatedId]: rowCreatedIdSchema,
  [SystemSchemaIds.RowVersionId]: rowVersionIdSchema,
  [SystemSchemaIds.RowPublishedAt]: rowPublishedAtSchema,
  [SystemSchemaIds.RowUpdatedAt]: rowUpdatedAtSchema,
  [SystemSchemaIds.RowHash]: rowHashSchema,
  [SystemSchemaIds.RowSchemaHash]: rowSchemaHashSchema,
};

function parse(schema: JsonObjectSchema, refSchemas?: RefSchemas) {
  const parser = new SchemaParser();
  return parser.parse(schema, refSchemas ?? defaultRefSchemas);
}

beforeEach(() => {
  resetNodeIdCounter();
});

describe('extractColumns', () => {
  it('empty schema returns empty array', () => {
    const root = parse(obj({}));
    expect(extractColumns(root)).toEqual([]);
  });

  it('single string field', () => {
    const root = parse(obj({ name: str() }));
    const columns = extractColumns(root);
    expect(columns).toEqual([
      {
        field: 'name',
        label: 'name',
        fieldType: FilterFieldType.String,
        isSystem: false,
        isDeprecated: false,
        hasFormula: false,
        isSortable: true,
      },
    ]);
  });

  it('multiple primitives with correct types', () => {
    const root = parse(obj({ active: bool(), age: num(), name: str() }));
    const columns = extractColumns(root);
    expect(columns).toHaveLength(3);
    expect(columns[0]).toMatchObject({
      field: 'active',
      fieldType: FilterFieldType.Boolean,
    });
    expect(columns[1]).toMatchObject({
      field: 'age',
      fieldType: FilterFieldType.Number,
    });
    expect(columns[2]).toMatchObject({
      field: 'name',
      fieldType: FilterFieldType.String,
    });
  });

  it('nested object flattens to dot-path', () => {
    const root = parse(
      obj({
        address: obj({ city: str(), zip: str() }),
      }),
    );
    const columns = extractColumns(root);
    expect(columns).toHaveLength(2);
    expect(columns[0]).toMatchObject({
      field: 'address.city',
      label: 'address.city',
    });
    expect(columns[1]).toMatchObject({
      field: 'address.zip',
      label: 'address.zip',
    });
  });

  it('array field is skipped', () => {
    const root = parse(
      obj({
        name: str(),
        tags: arr(str()),
      }),
    );
    const columns = extractColumns(root);
    expect(columns).toHaveLength(1);
    expect(columns[0]).toMatchObject({ field: 'name' });
  });

  it('foreign key field', () => {
    const root = parse(
      obj({
        authorId: str({ foreignKey: 'authors' }),
      }),
    );
    const columns = extractColumns(root);
    expect(columns).toEqual([
      {
        field: 'authorId',
        label: 'authorId',
        fieldType: FilterFieldType.ForeignKey,
        foreignKeyTableId: 'authors',
        isSystem: false,
        isDeprecated: false,
        hasFormula: false,
        isSortable: true,
      },
    ]);
  });

  describe('file ref field', () => {
    it('produces parent File column and primitive sub-field columns', () => {
      const root = parse(
        obj({
          avatar: ref(SystemSchemaIds.File),
        }),
      );
      const columns = extractColumns(root);
      const fields = columns.map((c) => c.field);

      expect(columns[0]).toMatchObject({
        field: 'avatar',
        label: 'avatar',
        fieldType: FilterFieldType.File,
        isSystem: false,
      });

      expect(fields).toContain('avatar.status');
      expect(fields).toContain('avatar.fileId');
      expect(fields).toContain('avatar.url');
      expect(fields).toContain('avatar.fileName');
      expect(fields).toContain('avatar.hash');
      expect(fields).toContain('avatar.extension');
      expect(fields).toContain('avatar.mimeType');
      expect(fields).toContain('avatar.size');
      expect(fields).toContain('avatar.width');
      expect(fields).toContain('avatar.height');
    });

    it('sub-field columns have correct types', () => {
      const root = parse(
        obj({
          avatar: ref(SystemSchemaIds.File),
        }),
      );
      const columns = extractColumns(root);
      const lookup = new Map(columns.map((c) => [c.field, c]));

      expect(lookup.get('avatar.fileName')).toMatchObject({
        fieldType: FilterFieldType.String,
        label: 'avatar.fileName',
      });
      expect(lookup.get('avatar.size')).toMatchObject({
        fieldType: FilterFieldType.Number,
        label: 'avatar.size',
      });
      expect(lookup.get('avatar.width')).toMatchObject({
        fieldType: FilterFieldType.Number,
        label: 'avatar.width',
      });
      expect(lookup.get('avatar.height')).toMatchObject({
        fieldType: FilterFieldType.Number,
        label: 'avatar.height',
      });
    });

    it('file column is not sortable, sub-fields are sortable', () => {
      const root = parse(
        obj({
          avatar: ref(SystemSchemaIds.File),
        }),
      );
      const columns = extractColumns(root);
      const fileCol = columns.find((c) => c.field === 'avatar');
      expect(fileCol).toMatchObject({ isSortable: false });

      const subFields = columns.filter((c) => c.field.startsWith('avatar.'));
      for (const col of subFields) {
        expect(col.isSortable).toBe(true);
      }
    });

    it('sub-fields are not system columns', () => {
      const root = parse(
        obj({
          avatar: ref(SystemSchemaIds.File),
        }),
      );
      const columns = extractColumns(root);
      const subFields = columns.filter((c) => c.field.startsWith('avatar.'));
      for (const col of subFields) {
        expect(col.isSystem).toBe(false);
      }
    });
  });

  it('system field RowCreatedAt', () => {
    const root = parse(
      obj({
        createdAt: ref(SystemSchemaIds.RowCreatedAt),
      }),
    );
    const columns = extractColumns(root);
    expect(columns).toEqual([
      {
        field: SystemFieldId.CreatedAt,
        label: 'createdAt',
        fieldType: FilterFieldType.DateTime,
        isSystem: true,
        systemFieldId: SystemFieldId.CreatedAt,
        isDeprecated: false,
        hasFormula: false,
        isSortable: true,
      },
    ]);
  });

  it('system field RowId', () => {
    const root = parse(
      obj({
        id: ref(SystemSchemaIds.RowId),
      }),
    );
    const columns = extractColumns(root);
    expect(columns).toEqual([
      {
        field: SystemFieldId.Id,
        label: 'id',
        fieldType: FilterFieldType.String,
        isSystem: true,
        systemFieldId: SystemFieldId.Id,
        isDeprecated: false,
        hasFormula: false,
        isSortable: true,
      },
    ]);
  });

  it('deprecated field', () => {
    const root = parse(
      obj({
        oldField: str({ deprecated: true }),
      }),
    );
    const columns = extractColumns(root);
    expect(columns).toEqual([
      {
        field: 'oldField',
        label: 'oldField',
        fieldType: FilterFieldType.String,
        isSystem: false,
        isDeprecated: true,
        hasFormula: false,
        isSortable: false,
      },
    ]);
  });

  it('formula field is sortable and filterable', () => {
    const schema = obj({
      a: str(),
      b: str(),
      computed: strFormula('CONCAT(a, b)'),
    });
    const model = createSchemaModel(schema, { refSchemas: defaultRefSchemas });
    const columns = extractColumns(model.root);
    const computed = columns.find((c) => c.field === 'computed');
    expect(computed).toEqual({
      field: 'computed',
      label: 'computed',
      fieldType: FilterFieldType.String,
      isSystem: false,
      isDeprecated: false,
      hasFormula: true,
      isSortable: true,
    });
  });

  it('mixed schema with primitives, nested, array, ref, and system fields', () => {
    const root = parse(
      obj({
        avatar: ref(SystemSchemaIds.File),
        id: ref(SystemSchemaIds.RowId),
        meta: obj({ title: str() }),
        name: str(),
        score: num(),
        tags: arr(str()),
      }),
    );
    const columns = extractColumns(root);
    const fields = columns.map((c) => c.field);

    expect(fields[0]).toBe('avatar');
    expect(fields).toContain('avatar.status');
    expect(fields).toContain('avatar.fileName');
    expect(fields).toContain(SystemFieldId.Id);
    expect(fields).toContain('meta.title');
    expect(fields).toContain('name');
    expect(fields).toContain('score');

    expect(fields).not.toContain('tags');

    expect(columns.find((c) => c.field === 'avatar')).toMatchObject({
      fieldType: FilterFieldType.File,
      isSystem: false,
    });
    expect(columns.find((c) => c.field === SystemFieldId.Id)).toMatchObject({
      fieldType: FilterFieldType.String,
      isSystem: true,
      systemFieldId: SystemFieldId.Id,
    });
  });

  it('deeply nested object flattens to a.b.c path', () => {
    const root = parse(
      obj({
        a: obj({ b: obj({ c: str() }) }),
      }),
    );
    const columns = extractColumns(root);
    expect(columns).toHaveLength(1);
    expect(columns[0]).toMatchObject({ field: 'a.b.c', label: 'a.b.c' });
  });
});
