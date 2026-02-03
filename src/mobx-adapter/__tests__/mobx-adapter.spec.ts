import { describe, it, expect } from '@jest/globals';
import { autorun } from 'mobx';
import { mobxAdapter } from '../mobx-adapter.js';

describe('mobxAdapter', () => {
  describe('makeObservable', () => {
    it('makes properties observable', () => {
      class Counter {
        value = 0;

        constructor() {
          mobxAdapter.makeObservable(this, {
            value: 'observable',
          });
        }
      }

      const counter = new Counter();
      const values: number[] = [];

      autorun(() => values.push(counter.value));

      counter.value = 1;
      counter.value = 2;

      expect(values).toEqual([0, 1, 2]);
    });

    it('makes computed properties work', () => {
      class Store {
        items: number[] = [1, 2, 3];

        get total() {
          return this.items.reduce((a, b) => a + b, 0);
        }

        constructor() {
          mobxAdapter.makeObservable(this, {
            items: 'observable',
            total: 'computed',
          });
        }
      }

      const store = new Store();
      expect(store.total).toBe(6);

      store.items.push(4);
      expect(store.total).toBe(10);
    });

    it('makes action methods work', () => {
      class Store {
        count = 0;

        increment() {
          this.count += 1;
        }

        constructor() {
          mobxAdapter.makeObservable(this, {
            count: 'observable',
            increment: 'action',
          });
        }
      }

      const store = new Store();
      const values: number[] = [];

      autorun(() => values.push(store.count));

      store.increment();
      store.increment();

      expect(values).toEqual([0, 1, 2]);
    });

    it('makes observable.ref work for reference changes only', () => {
      class Store {
        data = { value: 1 };

        constructor() {
          mobxAdapter.makeObservable(this, {
            data: 'observable.ref',
          });
        }
      }

      const store = new Store();
      let runCount = 0;

      autorun(() => {
        void store.data;
        runCount++;
      });

      expect(runCount).toBe(1);

      store.data.value = 2;
      expect(runCount).toBe(1);

      store.data = { value: 3 };
      expect(runCount).toBe(2);
    });
  });

  describe('observableArray', () => {
    it('returns MobX observable array', () => {
      const arr = mobxAdapter.observableArray<number>();
      const values: number[][] = [];

      autorun(() => values.push([...arr]));

      arr.push(1);
      arr.push(2);

      expect(values).toEqual([[], [1], [1, 2]]);
    });

    it('supports array methods like splice', () => {
      const arr = mobxAdapter.observableArray<string>();
      arr.push('a', 'b', 'c');

      const snapshots: string[][] = [];
      autorun(() => snapshots.push([...arr]));

      arr.splice(1, 1, 'x', 'y');

      expect(snapshots).toEqual([
        ['a', 'b', 'c'],
        ['a', 'x', 'y', 'c'],
      ]);
    });
  });

  describe('observableMap', () => {
    it('returns MobX observable map', () => {
      const map = mobxAdapter.observableMap<string, number>();
      const values: number[] = [];

      autorun(() => values.push(map.get('key') ?? 0));

      map.set('key', 1);
      map.set('key', 2); // eslint-disable-line sonarjs/no-element-overwrite -- intentional: testing reaction on value update

      expect(values).toEqual([0, 1, 2]);
    });

    it('supports map methods like delete', () => {
      const map = mobxAdapter.observableMap<string, number>();
      map.set('a', 1);
      map.set('b', 2);

      const snapshots: Array<[string, number][]> = [];
      autorun(() => snapshots.push([...map.entries()]));

      map.delete('a');

      expect(snapshots).toEqual([
        [
          ['a', 1],
          ['b', 2],
        ],
        [['b', 2]],
      ]);
    });

    it('tracks has() calls', () => {
      const map = mobxAdapter.observableMap<string, number>();
      const hasKey: boolean[] = [];

      autorun(() => hasKey.push(map.has('key')));

      map.set('key', 1);
      map.delete('key');

      expect(hasKey).toEqual([false, true, false]);
    });
  });

  describe('reaction', () => {
    it('creates reaction and returns dispose', () => {
      class Store {
        value = 0;
        constructor() {
          mobxAdapter.makeObservable(this, { value: 'observable' });
        }
      }

      const store = new Store();
      const effects: number[] = [];

      const dispose = mobxAdapter.reaction(
        () => store.value,
        (value) => effects.push(value),
      );

      store.value = 1;
      store.value = 2;

      dispose();

      store.value = 3;

      expect(effects).toEqual([1, 2]);
    });

    it('does not fire on initial value', () => {
      class Store {
        value = 5;
        constructor() {
          mobxAdapter.makeObservable(this, { value: 'observable' });
        }
      }

      const store = new Store();
      const effects: number[] = [];

      const dispose = mobxAdapter.reaction(
        () => store.value,
        (value) => effects.push(value),
      );

      expect(effects).toEqual([]);

      store.value = 10;

      dispose();

      expect(effects).toEqual([10]);
    });
  });

  describe('runInAction', () => {
    it('batches updates', () => {
      class Store {
        a = 0;
        b = 0;
        constructor() {
          mobxAdapter.makeObservable(this, {
            a: 'observable',
            b: 'observable',
          });
        }
      }

      const store = new Store();
      let count = 0;

      autorun(() => {
        void store.a;
        void store.b;
        count++;
      });

      expect(count).toBe(1);

      mobxAdapter.runInAction(() => {
        store.a = 1;
        store.b = 1;
      });

      expect(count).toBe(2);
    });

    it('returns the value from the function', () => {
      const result = mobxAdapter.runInAction(() => {
        return 42;
      });

      expect(result).toBe(42);
    });

    it('returns complex values', () => {
      const result = mobxAdapter.runInAction(() => {
        return { name: 'test', items: [1, 2, 3] };
      });

      expect(result).toEqual({ name: 'test', items: [1, 2, 3] });
    });
  });
});
