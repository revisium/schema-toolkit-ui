import { jest } from '@jest/globals';
import { ViewSettingsBadgeModel } from '../ViewSettingsBadgeModel';

describe('ViewSettingsBadgeModel', () => {
  let model: ViewSettingsBadgeModel;

  beforeEach(() => {
    model = new ViewSettingsBadgeModel();
  });

  describe('change detection', () => {
    it('no changes initially', () => {
      expect(model.hasChanges).toBe(false);
    });

    it('detected after checkForChanges', () => {
      model.saveSnapshot({ a: 1 });
      model.checkForChanges({ a: 2 });
      expect(model.hasChanges).toBe(true);
    });

    it('same state shows no change', () => {
      model.saveSnapshot({ a: 1 });
      model.checkForChanges({ a: 1 });
      expect(model.hasChanges).toBe(false);
    });

    it('saveSnapshot resets changes', () => {
      model.saveSnapshot({ a: 1 });
      model.checkForChanges({ a: 2 });
      expect(model.hasChanges).toBe(true);
      model.saveSnapshot({ a: 2 });
      expect(model.hasChanges).toBe(false);
    });

    it('complex object comparison', () => {
      const state = { items: [1, 2, 3], nested: { x: true } };
      model.saveSnapshot(state);
      model.checkForChanges(state);
      expect(model.hasChanges).toBe(false);
      model.checkForChanges({ items: [1, 2], nested: { x: true } });
      expect(model.hasChanges).toBe(true);
    });

    it('snapshot persists across checks', () => {
      model.saveSnapshot({ a: 1 });
      model.checkForChanges({ a: 2 });
      model.checkForChanges({ a: 1 });
      expect(model.hasChanges).toBe(false);
    });
  });

  describe('modes', () => {
    it('canSave default false', () => {
      expect(model.canSave).toBe(false);
    });

    it('setCanSave toggles', () => {
      model.setCanSave(true);
      expect(model.canSave).toBe(true);
      model.setCanSave(false);
      expect(model.canSave).toBe(false);
    });

    it('canSave independent of hasChanges', () => {
      model.setCanSave(true);
      expect(model.canSave).toBe(true);
      expect(model.hasChanges).toBe(false);
    });
  });

  describe('save', () => {
    it('calls onSave callback', () => {
      const onSave = jest.fn();
      model.setOnSave(onSave);
      model.save();
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('updates snapshot and clears hasChanges', () => {
      model.saveSnapshot({ a: 1 });
      model.checkForChanges({ a: 2 });
      expect(model.hasChanges).toBe(true);
      model.save();
      expect(model.hasChanges).toBe(false);
    });

    it('noop without callback', () => {
      expect(() => model.save()).not.toThrow();
    });
  });

  describe('revert', () => {
    it('calls onRevert callback', () => {
      const onRevert = jest.fn();
      model.setOnRevert(onRevert);
      model.revert();
      expect(onRevert).toHaveBeenCalledTimes(1);
    });

    it('resets currentSnapshot and clears hasChanges', () => {
      model.saveSnapshot({ a: 1 });
      model.checkForChanges({ a: 2 });
      expect(model.hasChanges).toBe(true);
      model.revert();
      expect(model.hasChanges).toBe(false);
    });

    it('noop without callback', () => {
      expect(() => model.revert()).not.toThrow();
    });
  });

  describe('visibility', () => {
    it('visible when hasChanges', () => {
      model.saveSnapshot({ a: 1 });
      model.checkForChanges({ a: 2 });
      expect(model.isVisible).toBe(true);
    });

    it('not visible otherwise', () => {
      expect(model.isVisible).toBe(false);
      model.saveSnapshot({ a: 1 });
      expect(model.isVisible).toBe(false);
    });
  });

  describe('popover', () => {
    it('setPopoverOpen toggles', () => {
      expect(model.isPopoverOpen).toBe(false);
      model.setPopoverOpen(true);
      expect(model.isPopoverOpen).toBe(true);
      model.setPopoverOpen(false);
      expect(model.isPopoverOpen).toBe(false);
    });
  });
});
