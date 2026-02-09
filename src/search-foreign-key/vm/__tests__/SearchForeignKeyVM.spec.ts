import { jest } from '@jest/globals';
import { ensureReactivityProvider } from '../../../lib/initReactivity';
import { SearchForeignKeyVM } from '../SearchForeignKeyVM';
import type { SearchForeignKeySearchFn } from '../SearchForeignKeyVM';

beforeAll(() => {
  ensureReactivityProvider();
});

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('SearchForeignKeyVM', () => {
  function createOnSearch(
    override?: SearchForeignKeySearchFn,
  ): jest.Mock<SearchForeignKeySearchFn> {
    if (override) {
      return jest.fn(override);
    }
    return jest.fn(() =>
      Promise.resolve({
        ids: ['row-1', 'row-2', 'row-3'],
        hasMore: false,
      }),
    );
  }

  describe('initial state', () => {
    it('starts in loading state', () => {
      const onSearch = createOnSearch();
      const vm = new SearchForeignKeyVM('products', onSearch);

      expect(vm.state).toBe('loading');
      expect(vm.showLoading).toBe(true);
    });

    it('exposes tableId', () => {
      const onSearch = createOnSearch();
      const vm = new SearchForeignKeyVM('products', onSearch);

      expect(vm.tableId).toBe('products');
    });
  });

  describe('init', () => {
    it('transitions to list state after init', async () => {
      const onSearch = createOnSearch();
      const vm = new SearchForeignKeyVM('products', onSearch);

      vm.init();
      await delay(50);

      expect(vm.state).toBe('list');
      expect(vm.showList).toBe(true);
      expect(vm.ids).toEqual(['row-1', 'row-2', 'row-3']);
      expect(onSearch).toHaveBeenCalledWith('products', '');

      vm.dispose();
    });

    it('transitions to empty state when no rows exist', async () => {
      const onSearch = createOnSearch(() =>
        Promise.resolve({ ids: [], hasMore: false }),
      );
      const vm = new SearchForeignKeyVM('products', onSearch);

      vm.init();
      await delay(50);

      expect(vm.state).toBe('empty');
      expect(vm.showEmpty).toBe(true);

      vm.dispose();
    });

    it('transitions to error state when callback is missing', async () => {
      const vm = new SearchForeignKeyVM('products', null);

      vm.init();
      await delay(50);

      expect(vm.state).toBe('error');
      expect(vm.showError).toBe(true);

      vm.dispose();
    });

    it('transitions to error state when callback throws', async () => {
      const onSearch = createOnSearch(() =>
        Promise.reject(new Error('Network error')),
      );
      const vm = new SearchForeignKeyVM('products', onSearch);

      vm.init();
      await delay(50);

      expect(vm.state).toBe('error');
      expect(vm.showError).toBe(true);

      vm.dispose();
    });
  });

  describe('search', () => {
    it('debounces search and calls callback', async () => {
      const onSearch = createOnSearch();
      const vm = new SearchForeignKeyVM('products', onSearch);

      vm.init();
      await delay(50);

      vm.setSearch('row');
      expect(vm.search).toBe('row');

      await delay(400);

      expect(onSearch).toHaveBeenCalledWith('products', 'row');

      vm.dispose();
    });

    it('shows notFound when search returns empty', async () => {
      let callCount = 0;
      const onSearch = createOnSearch(() => {
        callCount++;
        if (callCount > 1) {
          return Promise.resolve({ ids: [], hasMore: false });
        }
        return Promise.resolve({ ids: ['row-1'], hasMore: false });
      });
      const vm = new SearchForeignKeyVM('products', onSearch);

      vm.init();
      await delay(50);

      expect(vm.state).toBe('list');

      vm.setSearch('nonexistent');
      await delay(400);

      expect(vm.state).toBe('notFound');
      expect(vm.showNotFound).toBe(true);

      vm.dispose();
    });
  });

  describe('computed states', () => {
    it('showInput is true for list and notFound', async () => {
      const onSearch = createOnSearch();
      const vm = new SearchForeignKeyVM('products', onSearch);

      vm.init();
      await delay(50);

      expect(vm.showInput).toBe(true);

      vm.dispose();
    });

    it('showFooter is true for list, notFound, error, empty', async () => {
      const onSearch = createOnSearch();
      const vm = new SearchForeignKeyVM('products', onSearch);

      vm.init();
      await delay(50);

      expect(vm.showFooter).toBe(true);

      vm.dispose();
    });
  });

  describe('dispose', () => {
    it('cleans up without errors', async () => {
      const onSearch = createOnSearch();
      const vm = new SearchForeignKeyVM('products', onSearch);

      vm.init();
      await delay(50);

      expect(() => vm.dispose()).not.toThrow();
    });
  });
});
