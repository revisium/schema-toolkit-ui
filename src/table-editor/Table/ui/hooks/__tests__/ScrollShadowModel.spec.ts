import { ScrollShadowModel, ShadowState } from '../useScrollShadow';

describe('ScrollShadowModel', () => {
  let model: ScrollShadowModel;
  let lastState: ShadowState | null;
  let callCount: number;

  beforeEach(() => {
    model = new ScrollShadowModel();
    lastState = null;
    callCount = 0;
    model.setOnChange((state) => {
      lastState = state;
      callCount++;
    });
  });

  it('notifies onChange when updated', () => {
    model.update(true, false);
    expect(lastState).toEqual({ left: true, right: false });
    expect(callCount).toBe(1);
  });

  it('notifies onChange when values change', () => {
    model.update(false, true);
    expect(lastState).toEqual({ left: false, right: true });

    model.update(true, true);
    expect(lastState).toEqual({ left: true, right: true });
    expect(callCount).toBe(2);
  });

  it('does not notify when values are unchanged', () => {
    model.update(true, false);
    expect(callCount).toBe(1);

    model.update(true, false);
    expect(callCount).toBe(1);
  });

  it('resets to false and notifies', () => {
    model.update(true, true);
    model.reset();
    expect(lastState).toEqual({ left: false, right: false });
    expect(callCount).toBe(2);
  });

  it('reset does not notify when already false', () => {
    model.reset();
    expect(callCount).toBe(0);
  });

  it('does not throw when onChange is null', () => {
    model.setOnChange(null);
    expect(() => model.update(true, true)).not.toThrow();
    expect(() => model.reset()).not.toThrow();
  });

  it('exposes showLeftShadow and showRightShadow', () => {
    model.update(true, false);
    expect(model.showLeftShadow).toBe(true);
    expect(model.showRightShadow).toBe(false);
  });

  describe('pause/resume', () => {
    it('skips notification while paused', () => {
      model.update(true, false);
      expect(callCount).toBe(1);

      model.pause();
      model.update(false, true);
      expect(callCount).toBe(1);
      expect(model.showLeftShadow).toBe(false);
      expect(model.showRightShadow).toBe(true);
    });

    it('notifies with latest values on resume', () => {
      model.update(true, false);

      model.pause();
      model.update(false, true);
      model.update(true, true);
      model.resume();

      expect(lastState).toEqual({ left: true, right: true });
      expect(callCount).toBe(2);
    });

    it('does not notify on resume if no updates during pause', () => {
      model.update(true, false);

      model.pause();
      model.resume();

      expect(callCount).toBe(1);
      expect(lastState).toEqual({ left: true, right: false });
    });
  });
});
