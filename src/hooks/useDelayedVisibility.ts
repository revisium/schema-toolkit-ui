import { useEffect, useRef, useState } from 'react';

interface UseDelayedVisibilityOptions {
  /** Delay before showing (ms). Avoids flash for fast loads. */
  delayMs?: number;
  /** Minimum time to stay visible once shown (ms). Avoids flash on hide. */
  minShowMs?: number;
}

/**
 * Controls visibility with a show delay and minimum display time.
 *
 * - If `active` becomes false before `delayMs` elapses → never shown.
 * - If shown, stays visible for at least `minShowMs` after `active` becomes false.
 */
export function useDelayedVisibility(
  active: boolean,
  { delayMs = 150, minShowMs = 300 }: UseDelayedVisibilityOptions = {},
): boolean {
  const [visible, setVisible] = useState(false);
  const shownAt = useRef<number | null>(null);

  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, delayMs);
      return () => clearTimeout(timer);
    }

    if (shownAt.current !== null) {
      const elapsed = Date.now() - shownAt.current;
      const remaining = minShowMs - elapsed;
      if (remaining > 0) {
        const timer = setTimeout(() => {
          shownAt.current = null;
          setVisible(false);
        }, remaining);
        return () => clearTimeout(timer);
      }
      shownAt.current = null;
    }

    setVisible(false);
    return undefined;
  }, [active, delayMs, minShowMs]);

  return visible;
}
