import type { FilterCondition, FilterGroup } from './types.js';

export function findConditionInGroup(
  group: FilterGroup,
  id: string,
): { condition: FilterCondition; parent: FilterGroup } | null {
  for (const condition of group.conditions) {
    if (condition.id === id) {
      return { condition, parent: group };
    }
  }
  for (const subGroup of group.groups) {
    const found = findConditionInGroup(subGroup, id);
    if (found) {
      return found;
    }
  }
  return null;
}

export function findGroupInTree(
  group: FilterGroup,
  id: string,
): FilterGroup | null {
  if (group.id === id) {
    return group;
  }
  for (const subGroup of group.groups) {
    const found = findGroupInTree(subGroup, id);
    if (found) {
      return found;
    }
  }
  return null;
}

export function removeGroupFromTree(parent: FilterGroup, id: string): boolean {
  const index = parent.groups.findIndex((g) => g.id === id);
  if (index !== -1) {
    parent.groups.splice(index, 1);
    return true;
  }
  for (const subGroup of parent.groups) {
    if (removeGroupFromTree(subGroup, id)) {
      return true;
    }
  }
  return false;
}

export function countConditions(group: FilterGroup): number {
  let count = group.conditions.length;
  for (const subGroup of group.groups) {
    count += countConditions(subGroup);
  }
  return count;
}

export function syncNextIds(group: FilterGroup): {
  nextConditionId: number;
  nextGroupId: number;
} {
  const extractNum = (id: string, prefix: string): number => {
    if (id.startsWith(prefix)) {
      const num = Number(id.slice(prefix.length));
      if (!Number.isNaN(num)) {
        return num;
      }
    }
    return 0;
  };

  let maxCondition = 0;
  let maxGroup = 0;

  const walk = (g: FilterGroup): void => {
    maxGroup = Math.max(maxGroup, extractNum(g.id, 'g-'));
    for (const c of g.conditions) {
      maxCondition = Math.max(maxCondition, extractNum(c.id, 'c-'));
    }
    for (const sub of g.groups) {
      walk(sub);
    }
  };

  walk(group);
  return { nextConditionId: maxCondition + 1, nextGroupId: maxGroup + 1 };
}
