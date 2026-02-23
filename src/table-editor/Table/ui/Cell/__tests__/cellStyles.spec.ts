import { buildSelectionBoxShadow, SELECTION_BORDER_COLOR } from '../cellStyles';

describe('buildSelectionBoxShadow', () => {
  it('returns null when no edges are active', () => {
    const result = buildSelectionBoxShadow({
      top: false,
      bottom: false,
      left: false,
      right: false,
    });
    expect(result).toBeNull();
  });

  it('returns top shadow only', () => {
    const result = buildSelectionBoxShadow({
      top: true,
      bottom: false,
      left: false,
      right: false,
    });
    expect(result).toBe(`inset 0 2px 0 0 ${SELECTION_BORDER_COLOR}`);
  });

  it('returns bottom shadow only', () => {
    const result = buildSelectionBoxShadow({
      top: false,
      bottom: true,
      left: false,
      right: false,
    });
    expect(result).toBe(`inset 0 -2px 0 0 ${SELECTION_BORDER_COLOR}`);
  });

  it('returns left shadow only', () => {
    const result = buildSelectionBoxShadow({
      top: false,
      bottom: false,
      left: true,
      right: false,
    });
    expect(result).toBe(`inset 2px 0 0 0 ${SELECTION_BORDER_COLOR}`);
  });

  it('returns right shadow only', () => {
    const result = buildSelectionBoxShadow({
      top: false,
      bottom: false,
      left: false,
      right: true,
    });
    expect(result).toBe(`inset -2px 0 0 0 ${SELECTION_BORDER_COLOR}`);
  });

  it('returns all four edges', () => {
    const result = buildSelectionBoxShadow({
      top: true,
      bottom: true,
      left: true,
      right: true,
    });
    const shadows = result!.split(', ');
    expect(shadows).toHaveLength(4);
    expect(shadows).toContain(`inset 0 2px 0 0 ${SELECTION_BORDER_COLOR}`);
    expect(shadows).toContain(`inset 0 -2px 0 0 ${SELECTION_BORDER_COLOR}`);
    expect(shadows).toContain(`inset 2px 0 0 0 ${SELECTION_BORDER_COLOR}`);
    expect(shadows).toContain(`inset -2px 0 0 0 ${SELECTION_BORDER_COLOR}`);
  });

  it('returns top and left edges', () => {
    const result = buildSelectionBoxShadow({
      top: true,
      bottom: false,
      left: true,
      right: false,
    });
    const shadows = result!.split(', ');
    expect(shadows).toHaveLength(2);
    expect(shadows).toContain(`inset 0 2px 0 0 ${SELECTION_BORDER_COLOR}`);
    expect(shadows).toContain(`inset 2px 0 0 0 ${SELECTION_BORDER_COLOR}`);
  });

  it('returns bottom and right edges', () => {
    const result = buildSelectionBoxShadow({
      top: false,
      bottom: true,
      left: false,
      right: true,
    });
    const shadows = result!.split(', ');
    expect(shadows).toHaveLength(2);
    expect(shadows).toContain(`inset 0 -2px 0 0 ${SELECTION_BORDER_COLOR}`);
    expect(shadows).toContain(`inset -2px 0 0 0 ${SELECTION_BORDER_COLOR}`);
  });
});
