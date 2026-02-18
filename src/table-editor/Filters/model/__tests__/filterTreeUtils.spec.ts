import { FilterFieldType } from '../../../shared/field-types';
import { FilterOperator } from '../operators';
import {
  countConditions,
  findConditionInGroup,
  findGroupInTree,
  removeGroupFromTree,
  syncNextIds,
} from '../filterTreeUtils';
import type { FilterCondition, FilterGroup } from '../types';

function makeCondition(id: string): FilterCondition {
  return {
    id,
    field: 'name',
    fieldType: FilterFieldType.String,
    operator: FilterOperator.Equals,
    value: '',
  };
}

function makeGroup(
  id: string,
  conditions: FilterCondition[] = [],
  groups: FilterGroup[] = [],
): FilterGroup {
  return { id, logic: 'and', conditions, groups };
}

describe('findConditionInGroup', () => {
  it('finds condition in root group', () => {
    const c1 = makeCondition('c-1');
    const root = makeGroup('g-1', [c1]);

    const result = findConditionInGroup(root, 'c-1');

    expect(result).not.toBeNull();
    expect(result?.condition).toBe(c1);
    expect(result?.parent).toBe(root);
  });

  it('finds condition among multiple conditions', () => {
    const c1 = makeCondition('c-1');
    const c2 = makeCondition('c-2');
    const c3 = makeCondition('c-3');
    const root = makeGroup('g-1', [c1, c2, c3]);

    const result = findConditionInGroup(root, 'c-2');

    expect(result).not.toBeNull();
    expect(result?.condition).toBe(c2);
    expect(result?.parent).toBe(root);
  });

  it('finds condition in nested subgroup', () => {
    const c1 = makeCondition('c-1');
    const c2 = makeCondition('c-2');
    const child = makeGroup('g-2', [c2]);
    const root = makeGroup('g-1', [c1], [child]);

    const result = findConditionInGroup(root, 'c-2');

    expect(result).not.toBeNull();
    expect(result?.condition).toBe(c2);
    expect(result?.parent).toBe(child);
  });

  it('finds condition in deeply nested subgroup', () => {
    const c1 = makeCondition('c-1');
    const deepChild = makeGroup('g-3', [c1]);
    const midChild = makeGroup('g-2', [], [deepChild]);
    const root = makeGroup('g-1', [], [midChild]);

    const result = findConditionInGroup(root, 'c-1');

    expect(result).not.toBeNull();
    expect(result?.condition).toBe(c1);
    expect(result?.parent).toBe(deepChild);
  });

  it('returns null when condition not found', () => {
    const c1 = makeCondition('c-1');
    const root = makeGroup('g-1', [c1]);

    const result = findConditionInGroup(root, 'c-999');

    expect(result).toBeNull();
  });

  it('returns null for empty group', () => {
    const root = makeGroup('g-1');

    const result = findConditionInGroup(root, 'c-1');

    expect(result).toBeNull();
  });

  it('searches subgroups only after checking root conditions', () => {
    const rootCondition = makeCondition('c-1');
    const childCondition = makeCondition('c-1');
    const child = makeGroup('g-2', [childCondition]);
    const root = makeGroup('g-1', [rootCondition], [child]);

    const result = findConditionInGroup(root, 'c-1');

    expect(result).not.toBeNull();
    expect(result?.parent).toBe(root);
    expect(result?.condition).toBe(rootCondition);
  });
});

describe('findGroupInTree', () => {
  it('finds the root group by its id', () => {
    const root = makeGroup('g-1');

    const result = findGroupInTree(root, 'g-1');

    expect(result).toBe(root);
  });

  it('finds a direct child group', () => {
    const child = makeGroup('g-2');
    const root = makeGroup('g-1', [], [child]);

    const result = findGroupInTree(root, 'g-2');

    expect(result).toBe(child);
  });

  it('finds a deeply nested group', () => {
    const deepChild = makeGroup('g-3');
    const midChild = makeGroup('g-2', [], [deepChild]);
    const root = makeGroup('g-1', [], [midChild]);

    const result = findGroupInTree(root, 'g-3');

    expect(result).toBe(deepChild);
  });

  it('finds among multiple sibling groups', () => {
    const child1 = makeGroup('g-2');
    const child2 = makeGroup('g-3');
    const child3 = makeGroup('g-4');
    const root = makeGroup('g-1', [], [child1, child2, child3]);

    const result = findGroupInTree(root, 'g-4');

    expect(result).toBe(child3);
  });

  it('returns null when group not found', () => {
    const child = makeGroup('g-2');
    const root = makeGroup('g-1', [], [child]);

    const result = findGroupInTree(root, 'g-999');

    expect(result).toBeNull();
  });

  it('returns null for tree with no subgroups', () => {
    const root = makeGroup('g-1', [makeCondition('c-1')]);

    const result = findGroupInTree(root, 'g-2');

    expect(result).toBeNull();
  });
});

describe('removeGroupFromTree', () => {
  it('removes a direct child group', () => {
    const child = makeGroup('g-2');
    const root = makeGroup('g-1', [], [child]);

    const result = removeGroupFromTree(root, 'g-2');

    expect(result).toBe(true);
    expect(root.groups).toHaveLength(0);
  });

  it('removes correct group among siblings', () => {
    const child1 = makeGroup('g-2');
    const child2 = makeGroup('g-3');
    const child3 = makeGroup('g-4');
    const root = makeGroup('g-1', [], [child1, child2, child3]);

    const result = removeGroupFromTree(root, 'g-3');

    expect(result).toBe(true);
    expect(root.groups).toHaveLength(2);
    expect(root.groups[0]).toBe(child1);
    expect(root.groups[1]).toBe(child3);
  });

  it('removes a nested group', () => {
    const deepChild = makeGroup('g-3');
    const midChild = makeGroup('g-2', [], [deepChild]);
    const root = makeGroup('g-1', [], [midChild]);

    const result = removeGroupFromTree(root, 'g-3');

    expect(result).toBe(true);
    expect(midChild.groups).toHaveLength(0);
    expect(root.groups).toHaveLength(1);
  });

  it('returns false when group not found', () => {
    const child = makeGroup('g-2');
    const root = makeGroup('g-1', [], [child]);

    const result = removeGroupFromTree(root, 'g-999');

    expect(result).toBe(false);
    expect(root.groups).toHaveLength(1);
  });

  it('returns false for empty tree', () => {
    const root = makeGroup('g-1');

    const result = removeGroupFromTree(root, 'g-2');

    expect(result).toBe(false);
  });

  it('does not remove the root group itself', () => {
    const root = makeGroup('g-1');

    const result = removeGroupFromTree(root, 'g-1');

    expect(result).toBe(false);
  });

  it('mutates the parent groups array', () => {
    const child1 = makeGroup('g-2');
    const child2 = makeGroup('g-3');
    const root = makeGroup('g-1', [], [child1, child2]);
    const originalGroups = root.groups;

    removeGroupFromTree(root, 'g-2');

    expect(root.groups).toBe(originalGroups);
    expect(root.groups).toEqual([child2]);
  });
});

describe('countConditions', () => {
  it('returns 0 for empty group', () => {
    const root = makeGroup('g-1');

    expect(countConditions(root)).toBe(0);
  });

  it('counts conditions in root group', () => {
    const root = makeGroup('g-1', [
      makeCondition('c-1'),
      makeCondition('c-2'),
      makeCondition('c-3'),
    ]);

    expect(countConditions(root)).toBe(3);
  });

  it('counts conditions in nested groups', () => {
    const child = makeGroup('g-2', [
      makeCondition('c-2'),
      makeCondition('c-3'),
    ]);
    const root = makeGroup('g-1', [makeCondition('c-1')], [child]);

    expect(countConditions(root)).toBe(3);
  });

  it('counts conditions across deeply nested groups', () => {
    const deep = makeGroup('g-3', [makeCondition('c-4')]);
    const mid = makeGroup(
      'g-2',
      [makeCondition('c-2'), makeCondition('c-3')],
      [deep],
    );
    const root = makeGroup('g-1', [makeCondition('c-1')], [mid]);

    expect(countConditions(root)).toBe(4);
  });

  it('counts conditions across multiple sibling groups', () => {
    const child1 = makeGroup('g-2', [makeCondition('c-2')]);
    const child2 = makeGroup('g-3', [
      makeCondition('c-3'),
      makeCondition('c-4'),
    ]);
    const root = makeGroup('g-1', [makeCondition('c-1')], [child1, child2]);

    expect(countConditions(root)).toBe(4);
  });

  it('returns 0 for nested empty groups', () => {
    const child = makeGroup('g-2');
    const root = makeGroup('g-1', [], [child]);

    expect(countConditions(root)).toBe(0);
  });
});

describe('syncNextIds', () => {
  it('returns 1/1 for empty group with non-numeric id', () => {
    const root = makeGroup('root');

    const result = syncNextIds(root);

    expect(result).toEqual({ nextConditionId: 1, nextGroupId: 1 });
  });

  it('syncs from root group id', () => {
    const root = makeGroup('g-5');

    const result = syncNextIds(root);

    expect(result).toEqual({ nextConditionId: 1, nextGroupId: 6 });
  });

  it('syncs from condition ids', () => {
    const root = makeGroup('g-1', [makeCondition('c-3'), makeCondition('c-7')]);

    const result = syncNextIds(root);

    expect(result).toEqual({ nextConditionId: 8, nextGroupId: 2 });
  });

  it('syncs from nested group and condition ids', () => {
    const child = makeGroup('g-4', [makeCondition('c-2')]);
    const root = makeGroup('g-1', [makeCondition('c-5')], [child]);

    const result = syncNextIds(root);

    expect(result).toEqual({ nextConditionId: 6, nextGroupId: 5 });
  });

  it('syncs across deeply nested structure', () => {
    const deep = makeGroup('g-10', [makeCondition('c-20')]);
    const mid = makeGroup('g-3', [makeCondition('c-1')], [deep]);
    const root = makeGroup('g-1', [], [mid]);

    const result = syncNextIds(root);

    expect(result).toEqual({ nextConditionId: 21, nextGroupId: 11 });
  });

  it('handles ids without matching prefix', () => {
    const root = makeGroup('root', [
      {
        ...makeCondition('custom-id'),
        id: 'custom-id',
      },
    ]);

    const result = syncNextIds(root);

    expect(result).toEqual({ nextConditionId: 1, nextGroupId: 1 });
  });

  it('handles mix of prefixed and non-prefixed ids', () => {
    const child = makeGroup('custom-group', [makeCondition('c-5')]);
    const root = makeGroup('g-2', [makeCondition('custom-cond')], [child]);

    const result = syncNextIds(root);

    expect(result).toEqual({ nextConditionId: 6, nextGroupId: 3 });
  });

  it('handles id with prefix but non-numeric suffix', () => {
    const root = makeGroup('g-abc', [makeCondition('c-xyz')]);

    const result = syncNextIds(root);

    expect(result).toEqual({ nextConditionId: 1, nextGroupId: 1 });
  });

  it('handles multiple sibling groups', () => {
    const child1 = makeGroup('g-3', [makeCondition('c-1')]);
    const child2 = makeGroup('g-7', [makeCondition('c-4')]);
    const root = makeGroup('g-1', [makeCondition('c-9')], [child1, child2]);

    const result = syncNextIds(root);

    expect(result).toEqual({ nextConditionId: 10, nextGroupId: 8 });
  });

  it('handles zero-based ids', () => {
    const root = makeGroup('g-0', [makeCondition('c-0')]);

    const result = syncNextIds(root);

    expect(result).toEqual({ nextConditionId: 1, nextGroupId: 1 });
  });
});
