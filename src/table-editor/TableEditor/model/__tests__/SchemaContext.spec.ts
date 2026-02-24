import {
  obj,
  str,
  num,
  bool,
  arr,
  resetNodeIdCounter,
} from '@revisium/schema-toolkit';
import { SchemaContext, stripDataFieldPrefix } from '../SchemaContext';
import { SortModel } from '../../../Sortings/model/SortModel';
import { FilterModel } from '../../../Filters/model/FilterModel';
import { FilterFieldType } from '../../../shared/field-types';
import { SystemFieldId } from '../../../shared/system-fields';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('SchemaContext', () => {
  describe('object schema wrapping', () => {
    it('wraps object schema fields under data namespace', () => {
      const ctx = new SchemaContext();
      ctx.init(obj({ name: str(), age: num() }));
      const fields = ctx.allColumns.map((c) => c.field);
      expect(fields).toContain('data.name');
      expect(fields).toContain('data.age');
    });

    it('produces labels without data prefix', () => {
      const ctx = new SchemaContext();
      ctx.init(obj({ name: str(), age: num() }));
      const nameCol = ctx.allColumns.find((c) => c.field === 'data.name');
      const ageCol = ctx.allColumns.find((c) => c.field === 'data.age');
      expect(nameCol?.label).toBe('name');
      expect(ageCol?.label).toBe('age');
    });

    it('includes system fields at root level', () => {
      const ctx = new SchemaContext();
      ctx.init(obj({ name: str() }));
      const systemFields = ctx.allColumns.filter((c) => c.isSystem);
      const systemIds = systemFields.map((c) => c.field);
      expect(systemIds).toContain(SystemFieldId.Id);
      expect(systemIds).toContain(SystemFieldId.CreatedAt);
    });

    it('system fields are not nested under data', () => {
      const ctx = new SchemaContext();
      ctx.init(obj({ name: str() }));
      const idCol = ctx.allColumns.find((c) => c.field === SystemFieldId.Id);
      expect(idCol?.isSystem).toBe(true);
      expect(idCol?.field).toBe('id');
    });
  });

  describe('primitive schema wrapping', () => {
    it('wraps string schema under data', () => {
      const ctx = new SchemaContext();
      ctx.init(str());
      const dataCol = ctx.allColumns.find((c) => c.field === 'data');
      expect(dataCol).toBeDefined();
      expect(dataCol?.fieldType).toBe(FilterFieldType.String);
      expect(dataCol?.label).toBe('data');
    });

    it('wraps number schema under data', () => {
      const ctx = new SchemaContext();
      ctx.init(num());
      const dataCol = ctx.allColumns.find((c) => c.field === 'data');
      expect(dataCol).toBeDefined();
      expect(dataCol?.fieldType).toBe(FilterFieldType.Number);
    });

    it('wraps boolean schema under data', () => {
      const ctx = new SchemaContext();
      ctx.init(bool());
      const dataCol = ctx.allColumns.find((c) => c.field === 'data');
      expect(dataCol).toBeDefined();
      expect(dataCol?.fieldType).toBe(FilterFieldType.Boolean);
    });
  });

  describe('array schema wrapping', () => {
    it('wraps array schema under data (skipped as column)', () => {
      const ctx = new SchemaContext();
      ctx.init(arr(str()));
      const dataColumns = ctx.allColumns.filter((c) => !c.isSystem);
      expect(dataColumns).toHaveLength(0);
    });
  });

  describe('foreign key schema', () => {
    it('wraps FK fields under data namespace', () => {
      const ctx = new SchemaContext();
      ctx.init(
        obj({
          authorId: str({ foreignKey: 'authors' }),
        }),
      );
      const fkCol = ctx.allColumns.find((c) => c.field === 'data.authorId');
      expect(fkCol).toBeDefined();
      expect(fkCol?.fieldType).toBe(FilterFieldType.ForeignKey);
      expect(fkCol?.foreignKeyTableId).toBe('authors');
      expect(fkCol?.label).toBe('authorId');
    });
  });

  describe('name conflict prevention', () => {
    it('user field named id does not conflict with system id', () => {
      const ctx = new SchemaContext();
      ctx.init(obj({ id: str(), name: str() }));
      const idSystem = ctx.allColumns.find(
        (c) => c.field === SystemFieldId.Id && c.isSystem,
      );
      const idUser = ctx.allColumns.find(
        (c) => c.field === 'data.id' && !c.isSystem,
      );
      expect(idSystem).toBeDefined();
      expect(idUser).toBeDefined();
      expect(idSystem?.field).toBe('id');
      expect(idUser?.field).toBe('data.id');
    });

    it('user field named createdAt does not conflict with system createdAt', () => {
      const ctx = new SchemaContext();
      ctx.init(obj({ createdAt: str(), name: str() }));
      const sysField = ctx.allColumns.find(
        (c) => c.field === SystemFieldId.CreatedAt && c.isSystem,
      );
      const userField = ctx.allColumns.find(
        (c) => c.field === 'data.createdAt' && !c.isSystem,
      );
      expect(sysField).toBeDefined();
      expect(userField).toBeDefined();
    });
  });

  describe('sortable and filterable fields', () => {
    it('excludes deprecated fields from sortable', () => {
      const ctx = new SchemaContext();
      ctx.init(
        obj({
          name: str(),
          old: str({ deprecated: true }),
        }),
      );
      const sortable = ctx.sortableFields.map((c) => c.field);
      expect(sortable).toContain('data.name');
      expect(sortable).not.toContain('data.old');
    });

    it('filterable equals sortable', () => {
      const ctx = new SchemaContext();
      ctx.init(obj({ name: str() }));
      expect(ctx.filterableFields).toEqual(ctx.sortableFields);
    });
  });

  describe('wrappedDataSchema', () => {
    it('contains data key in properties', () => {
      const ctx = new SchemaContext();
      ctx.init(obj({ name: str() }));
      const wrapped = ctx.wrappedDataSchema;
      expect(wrapped).not.toBeNull();
      expect(Object.keys(wrapped!.properties ?? {})).toEqual(['data']);
    });
  });

  describe('sort integration', () => {
    it('SortModel works with data-namespaced fields', () => {
      const ctx = new SchemaContext();
      ctx.init(obj({ name: str(), age: num() }));

      const sortModel = new SortModel();
      sortModel.init(ctx.sortableFields);

      sortModel.addSort('data.name', 'asc');
      expect(sortModel.sorts).toHaveLength(1);
      expect(sortModel.sorts[0]).toEqual({
        field: 'data.name',
        direction: 'asc',
      });

      const serialized = sortModel.serializeToViewSorts();
      expect(serialized).toEqual([{ field: 'data.name', direction: 'asc' }]);

      sortModel.dispose();
    });

    it('SortModel applyViewSorts round-trips with data fields', () => {
      const ctx = new SchemaContext();
      ctx.init(obj({ name: str(), age: num() }));

      const sortModel = new SortModel();
      sortModel.init(ctx.sortableFields);

      sortModel.applyViewSorts([{ field: 'data.age', direction: 'desc' }]);

      expect(sortModel.sorts).toHaveLength(1);
      expect(sortModel.sorts[0]).toEqual({
        field: 'data.age',
        direction: 'desc',
      });

      sortModel.dispose();
    });

    it('SortModel ignores unknown fields during applyViewSorts', () => {
      const ctx = new SchemaContext();
      ctx.init(obj({ name: str() }));

      const sortModel = new SortModel();
      sortModel.init(ctx.sortableFields);

      sortModel.applyViewSorts([
        { field: 'data.nonexistent', direction: 'asc' },
      ]);

      expect(sortModel.sorts).toHaveLength(0);

      sortModel.dispose();
    });

    it('SortModel works with primitive root data field', () => {
      const ctx = new SchemaContext();
      ctx.init(str());

      const sortModel = new SortModel();
      sortModel.init(ctx.sortableFields);

      sortModel.addSort('data', 'asc');
      expect(sortModel.sorts).toHaveLength(1);
      expect(sortModel.sorts[0]).toEqual({ field: 'data', direction: 'asc' });

      sortModel.dispose();
    });
  });

  describe('stripDataFieldPrefix', () => {
    it('strips data. prefix from object fields', () => {
      expect(stripDataFieldPrefix('data.name')).toBe('name');
      expect(stripDataFieldPrefix('data.age')).toBe('age');
    });

    it('returns empty string for primitive root data field', () => {
      expect(stripDataFieldPrefix('data')).toBe('');
    });

    it('does not strip from system fields', () => {
      expect(stripDataFieldPrefix('id')).toBe('id');
      expect(stripDataFieldPrefix('createdAt')).toBe('createdAt');
    });

    it('handles nested data fields', () => {
      expect(stripDataFieldPrefix('data.nested.field')).toBe('nested.field');
    });
  });

  describe('filter integration', () => {
    it('FilterModel initializes with data-namespaced fields', () => {
      const ctx = new SchemaContext();
      ctx.init(obj({ name: str(), score: num() }));

      const filterModel = new FilterModel();
      filterModel.init(ctx.filterableFields);

      filterModel.addConditionForField('data.name');
      expect(filterModel.totalConditionCount).toBe(1);

      filterModel.dispose();
    });

    it('FilterModel with name-conflicting fields', () => {
      const ctx = new SchemaContext();
      ctx.init(obj({ id: str(), name: str() }));

      const filterableFields = ctx.filterableFields.map((f) => f.field);
      expect(filterableFields).toContain('data.id');
      expect(filterableFields).toContain('data.name');
      expect(filterableFields).toContain('id');
    });

    it('FilterModel with primitive root', () => {
      const ctx = new SchemaContext();
      ctx.init(num());

      const filterableFields = ctx.filterableFields;
      const dataField = filterableFields.find((f) => f.field === 'data');
      expect(dataField).toBeDefined();
      expect(dataField?.fieldType).toBe(FilterFieldType.Number);
    });
  });
});
