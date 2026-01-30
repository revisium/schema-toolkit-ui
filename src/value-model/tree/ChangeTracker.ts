import type { Change, JsonPatch } from '../core/types';

export class ChangeTracker {
  private _changes: Change[] = [];

  get changes(): readonly Change[] {
    return this._changes;
  }

  get hasChanges(): boolean {
    return this._changes.length > 0;
  }

  track(change: Change): void {
    this._changes.push(change);
  }

  clear(): void {
    this._changes = [];
  }

  toPatches(): readonly JsonPatch[] {
    const patches: JsonPatch[] = [];

    for (const change of this._changes) {
      const patch = this.changeToPatches(change);
      patches.push(...patch);
    }

    return patches;
  }

  private changeToPatches(change: Change): JsonPatch[] {
    const path = change.path.asJsonPointer();

    switch (change.type) {
      case 'setValue':
        return [{ op: 'replace', path, value: change.value }];

      case 'addProperty':
        return [{ op: 'add', path, value: change.value }];

      case 'removeProperty':
        return [{ op: 'remove', path }];

      case 'arrayPush':
        return [{ op: 'add', path: `${path}/-`, value: change.value }];

      case 'arrayInsert':
        return [
          { op: 'add', path: `${path}/${change.index}`, value: change.value },
        ];

      case 'arrayRemove':
        return [{ op: 'remove', path: `${path}/${change.index}` }];

      case 'arrayMove': {
        const fromIndex = change.fromIndex ?? 0;
        const toIndex = change.toIndex ?? 0;
        return [
          {
            op: 'move',
            from: `${path}/${fromIndex}`,
            path: `${path}/${toIndex}`,
          },
        ];
      }

      case 'arrayReplace':
        return [
          {
            op: 'replace',
            path: `${path}/${change.index}`,
            value: change.value,
          },
        ];

      case 'arrayClear':
        return [{ op: 'replace', path, value: [] }];

      default:
        return [];
    }
  }
}
