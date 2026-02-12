import { useCallback, useEffect, useRef } from 'react';

/**
 * Defers the edit action until after the browser has fully settled
 * following a context menu close.
 *
 * Problem: when clicking "Edit" in a Chakra context menu, the menu
 * close triggers DOM cleanup (portal removal, focus-restore microtasks
 * from zag-js) that can race with the textarea editor mount. If the
 * textarea mounts and receives focus before the cleanup finishes,
 * the cleanup steals focus → textarea blur → cancelEdit.
 *
 * Solution: defer startEdit via requestAnimationFrame + setTimeout(0)
 * to ensure it runs after microtasks, React commit, and browser paint.
 */
export function useDeferredMenuEdit(editFn: (() => void) | undefined): {
  requestEdit: () => void;
  triggerIfRequested: () => boolean;
} {
  const requestedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const trigger = useCallback(() => {
    requestedRef.current = false;
    rafRef.current = null;
    timerRef.current = null;
    editFn?.();
  }, [editFn]);

  const requestEdit = useCallback(() => {
    requestedRef.current = true;
  }, []);

  const triggerIfRequested = useCallback(() => {
    if (!requestedRef.current) {
      return false;
    }
    cleanup();
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      timerRef.current = setTimeout(trigger, 0);
    });
    return true;
  }, [trigger, cleanup]);

  return { requestEdit, triggerIfRequested };
}
