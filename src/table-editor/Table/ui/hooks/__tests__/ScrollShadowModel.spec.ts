import { ScrollShadowModel } from '../useScrollShadow';

describe('ScrollShadowModel', () => {
  let model: ScrollShadowModel;
  let element: HTMLDivElement;

  beforeEach(() => {
    element = document.createElement('div');
    model = new ScrollShadowModel();
  });

  it('sets CSS variables on the element when updated', () => {
    model.setElement(element);
    model.update(true, false);
    expect(element.style.getPropertyValue('--shadow-left-opacity')).toBe('1');
    expect(element.style.getPropertyValue('--shadow-right-opacity')).toBe('0');
  });

  it('updates CSS variables when values change', () => {
    model.setElement(element);
    model.update(false, true);
    expect(element.style.getPropertyValue('--shadow-left-opacity')).toBe('0');
    expect(element.style.getPropertyValue('--shadow-right-opacity')).toBe('1');

    model.update(true, true);
    expect(element.style.getPropertyValue('--shadow-left-opacity')).toBe('1');
    expect(element.style.getPropertyValue('--shadow-right-opacity')).toBe('1');
  });

  it('resets CSS variables to 0', () => {
    model.setElement(element);
    model.update(true, true);
    model.reset();
    expect(element.style.getPropertyValue('--shadow-left-opacity')).toBe('0');
    expect(element.style.getPropertyValue('--shadow-right-opacity')).toBe('0');
  });

  it('does not throw when element is null', () => {
    expect(() => model.update(true, true)).not.toThrow();
    expect(() => model.reset()).not.toThrow();
  });

  it('exposes showLeftShadow and showRightShadow for non-CSS consumers', () => {
    model.setElement(element);
    model.update(true, false);
    expect(model.showLeftShadow).toBe(true);
    expect(model.showRightShadow).toBe(false);
  });

  describe('pause/resume', () => {
    it('skips CSS updates while paused', () => {
      model.setElement(element);
      model.update(true, false);
      expect(element.style.getPropertyValue('--shadow-left-opacity')).toBe('1');

      model.pause();
      model.update(false, true);
      expect(element.style.getPropertyValue('--shadow-left-opacity')).toBe('1');
      expect(element.style.getPropertyValue('--shadow-right-opacity')).toBe(
        '0',
      );
    });

    it('applies latest values on resume', () => {
      model.setElement(element);
      model.update(true, false);

      model.pause();
      model.update(false, true);
      model.update(true, true);
      model.resume();

      expect(element.style.getPropertyValue('--shadow-left-opacity')).toBe('1');
      expect(element.style.getPropertyValue('--shadow-right-opacity')).toBe(
        '1',
      );
    });

    it('does not apply stale values if no updates during pause', () => {
      model.setElement(element);
      model.update(true, false);

      model.pause();
      model.resume();

      expect(element.style.getPropertyValue('--shadow-left-opacity')).toBe('1');
      expect(element.style.getPropertyValue('--shadow-right-opacity')).toBe(
        '0',
      );
    });
  });
});
