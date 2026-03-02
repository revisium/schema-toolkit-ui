import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from '@jest/globals';
import { render, act } from '@testing-library/react';
import React, { useState } from 'react';
import { useDelayedVisibility } from '../useDelayedVisibility';

function TestComponent({
  active,
  delayMs,
  minShowMs,
}: Readonly<{
  active: boolean;
  delayMs?: number;
  minShowMs?: number;
}>) {
  const visible = useDelayedVisibility(active, { delayMs, minShowMs });
  return <div data-testid="target">{visible ? 'visible' : 'hidden'}</div>;
}

function ToggleComponent({
  delayMs,
  minShowMs,
}: Readonly<{
  delayMs?: number;
  minShowMs?: number;
}>) {
  const [active, setActive] = useState(true);
  const visible = useDelayedVisibility(active, { delayMs, minShowMs });
  return (
    <>
      <div data-testid="target">{visible ? 'visible' : 'hidden'}</div>
      <button data-testid="toggle" onClick={() => setActive((v) => !v)} />
    </>
  );
}

describe('useDelayedVisibility', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('is hidden initially even when active=true', () => {
    const { getByTestId } = render(
      <TestComponent active={true} delayMs={150} minShowMs={300} />,
    );
    expect(getByTestId('target').textContent).toBe('hidden');
  });

  it('becomes visible after delayMs', () => {
    const { getByTestId } = render(
      <TestComponent active={true} delayMs={150} minShowMs={300} />,
    );
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(getByTestId('target').textContent).toBe('visible');
  });

  it('never shows if active becomes false before delayMs', () => {
    const { getByTestId, rerender } = render(
      <TestComponent active={true} delayMs={150} minShowMs={300} />,
    );
    act(() => {
      jest.advanceTimersByTime(100);
    });
    rerender(<TestComponent active={false} delayMs={150} minShowMs={300} />);
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(getByTestId('target').textContent).toBe('hidden');
  });

  it('stays visible for minShowMs after active becomes false', () => {
    const { getByTestId } = render(
      <ToggleComponent delayMs={150} minShowMs={300} />,
    );

    // show the skeleton
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(getByTestId('target').textContent).toBe('visible');

    // deactivate immediately
    act(() => {
      getByTestId('toggle').click();
    });

    // still visible within minShowMs
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(getByTestId('target').textContent).toBe('visible');

    // hidden after minShowMs elapsed
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(getByTestId('target').textContent).toBe('hidden');
  });

  it('hides immediately if minShowMs already elapsed when active becomes false', () => {
    const { getByTestId } = render(
      <ToggleComponent delayMs={150} minShowMs={300} />,
    );

    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(getByTestId('target').textContent).toBe('visible');

    // wait longer than minShowMs
    act(() => {
      jest.advanceTimersByTime(400);
    });

    act(() => {
      getByTestId('toggle').click();
    });

    expect(getByTestId('target').textContent).toBe('hidden');
  });

  it('is always hidden when active=false from the start', () => {
    const { getByTestId } = render(
      <TestComponent active={false} delayMs={150} minShowMs={300} />,
    );
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(getByTestId('target').textContent).toBe('hidden');
  });
});
