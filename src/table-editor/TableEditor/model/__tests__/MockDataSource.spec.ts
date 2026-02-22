import { obj, str, num, bool } from '@revisium/schema-toolkit';
import { MockDataSource } from '../MockDataSource';

const TABLE_SCHEMA = obj({
  name: str(),
  age: num(),
  active: bool(),
});

function createDataSource(rowCount = 5) {
  const rows = Array.from({ length: rowCount }, (_, i) =>
    MockDataSource.createRow(`row-${i + 1}`, {
      name: `User ${i + 1}`,
      age: 20 + i,
      active: i % 2 === 0,
    }),
  );
  return new MockDataSource({
    dataSchema: TABLE_SCHEMA,
    rows,
  });
}

describe('MockDataSource', () => {
  describe('createRow', () => {
    it('creates RowDataItem with given id and data', () => {
      const row = MockDataSource.createRow('r1', { name: 'Alice' });
      expect(row).toEqual({ rowId: 'r1', data: { name: 'Alice' } });
    });
  });

  describe('fetchMetadata', () => {
    it('returns dataSchema and defaults', async () => {
      const ds = createDataSource();
      const meta = await ds.fetchMetadata();
      expect(meta.dataSchema).toBe(TABLE_SCHEMA);
      expect(meta.viewState).toBeNull();
      expect(meta.readonly).toBe(false);
    });

    it('logs each call', async () => {
      const ds = createDataSource();
      await ds.fetchMetadata();
      await ds.fetchMetadata();
      expect(ds.fetchMetadataLog).toHaveLength(2);
    });
  });

  describe('fetchRows', () => {
    it('returns all rows without filters', async () => {
      const ds = createDataSource(3);
      const result = await ds.fetchRows({
        where: null,
        orderBy: [],
        search: '',
        first: 50,
        after: null,
      });
      expect(result.rows).toHaveLength(3);
      expect(result.totalCount).toBe(3);
      expect(result.hasNextPage).toBe(false);
    });

    it('paginates with first/after', async () => {
      const ds = createDataSource(5);
      const page1 = await ds.fetchRows({
        where: null,
        orderBy: [],
        search: '',
        first: 2,
        after: null,
      });
      expect(page1.rows).toHaveLength(2);
      expect(page1.hasNextPage).toBe(true);
      expect(page1.endCursor).toBe('row-2');

      const page2 = await ds.fetchRows({
        where: null,
        orderBy: [],
        search: '',
        first: 2,
        after: 'row-2',
      });
      expect(page2.rows).toHaveLength(2);
      expect(page2.hasNextPage).toBe(true);
      expect(page2.endCursor).toBe('row-4');

      const page3 = await ds.fetchRows({
        where: null,
        orderBy: [],
        search: '',
        first: 2,
        after: 'row-4',
      });
      expect(page3.rows).toHaveLength(1);
      expect(page3.hasNextPage).toBe(false);
    });

    it('filters by search substring', async () => {
      const rows = [
        MockDataSource.createRow('r1', {
          name: 'Alice',
          age: 30,
          active: true,
        }),
        MockDataSource.createRow('r2', { name: 'Bob', age: 25, active: false }),
        MockDataSource.createRow('r3', {
          name: 'Charlie',
          age: 35,
          active: true,
        }),
      ];
      const ds = new MockDataSource({
        dataSchema: TABLE_SCHEMA,
        rows,
      });

      const result = await ds.fetchRows({
        where: null,
        orderBy: [],
        search: 'ali',
        first: 50,
        after: null,
      });
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]!.rowId).toBe('r1');
    });

    it('sorts by first orderBy entry', async () => {
      const rows = [
        MockDataSource.createRow('r1', {
          name: 'Charlie',
          age: 35,
          active: true,
        }),
        MockDataSource.createRow('r2', {
          name: 'Alice',
          age: 30,
          active: false,
        }),
        MockDataSource.createRow('r3', { name: 'Bob', age: 25, active: true }),
      ];
      const ds = new MockDataSource({
        dataSchema: TABLE_SCHEMA,
        rows,
      });

      const result = await ds.fetchRows({
        where: null,
        orderBy: [{ field: 'data.name', direction: 'asc' }],
        search: '',
        first: 50,
        after: null,
      });
      expect(result.rows.map((r) => r.data.name)).toEqual([
        'Alice',
        'Bob',
        'Charlie',
      ]);
    });

    it('sorts descending', async () => {
      const rows = [
        MockDataSource.createRow('r1', {
          name: 'Alice',
          age: 30,
          active: true,
        }),
        MockDataSource.createRow('r2', { name: 'Bob', age: 25, active: false }),
        MockDataSource.createRow('r3', {
          name: 'Charlie',
          age: 35,
          active: true,
        }),
      ];
      const ds = new MockDataSource({
        dataSchema: TABLE_SCHEMA,
        rows,
      });

      const result = await ds.fetchRows({
        where: null,
        orderBy: [{ field: 'data.age', direction: 'desc' }],
        search: '',
        first: 50,
        after: null,
      });
      expect(result.rows.map((r) => r.data.age)).toEqual([35, 30, 25]);
    });

    it('logs queries', async () => {
      const ds = createDataSource();
      const query = {
        where: null,
        orderBy: [],
        search: '',
        first: 50,
        after: null,
      };
      await ds.fetchRows(query);
      expect(ds.fetchLog).toHaveLength(1);
      expect(ds.fetchLog[0]).toBe(query);
    });
  });

  describe('patchCells', () => {
    it('updates in-memory data', async () => {
      const ds = createDataSource();
      const results = await ds.patchCells([
        { rowId: 'row-1', field: 'name', value: 'Updated' },
      ]);
      expect(results).toHaveLength(1);
      expect(results[0]!.ok).toBe(true);
      expect(ds.patchLog).toHaveLength(1);
    });

    it('returns failure for configured fail patches', async () => {
      const ds = new MockDataSource({
        dataSchema: TABLE_SCHEMA,
        rows: [
          MockDataSource.createRow('r1', {
            name: 'Alice',
            age: 30,
            active: true,
          }),
        ],
        failPatches: new Set(['r1/name']),
      });
      const results = await ds.patchCells([
        { rowId: 'r1', field: 'name', value: 'Bob' },
      ]);
      expect(results[0]!.ok).toBe(false);
      expect(results[0]!.error).toBeTruthy();
    });
  });

  describe('deleteRows', () => {
    it('removes rows from internal list', async () => {
      const ds = createDataSource(3);
      const result = await ds.deleteRows(['row-1', 'row-2']);
      expect(result.ok).toBe(true);
      expect(ds.deleteLog).toHaveLength(1);

      const remaining = await ds.fetchRows({
        where: null,
        orderBy: [],
        search: '',
        first: 50,
        after: null,
      });
      expect(remaining.rows).toHaveLength(1);
      expect(remaining.rows[0]!.rowId).toBe('row-3');
    });
  });

  describe('saveView', () => {
    it('returns ok and logs', async () => {
      const ds = createDataSource();
      const result = await ds.saveView({
        columns: [],
        filters: null,
        sorts: [],
        search: '',
      });
      expect(result.ok).toBe(true);
      expect(ds.saveViewLog).toHaveLength(1);
    });
  });
});
