import { useCallback, useEffect, useRef } from 'react';

/**
 * Defers the edit action until after zag-js (Chakra Menu) completes its
 * focus-restore microtask on menu close.
 *
 * Problem: when clicking "Edit" in a context menu, zag-js schedules
 * `queueMicrotask(() => trigger.focus())` to return focus to the trigger
 * element (the cell). If we start editing synchronously in onOpenChange,
 * the textarea mounts and receives focus, but then the microtask fires and
 * moves focus back to the cell div — which triggers blur → cancelEdit.
 *
 * Solution: defer startEdit via setTimeout(0) so it runs as a macrotask
 * after the microtask completes.
 */
export function useDeferredMenuEdit(editFn: (() => void) | undefined): {
  requestEdit: () => void;
  triggerIfRequested: () => boolean;
} {
  const requestedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const trigger = useCallback(() => {
    requestedRef.current = false;
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    editFn?.();
  }, [editFn]);

  const requestEdit = useCallback(() => {
    requestedRef.current = true;
  }, []);

  const triggerIfRequested = useCallback(() => {
    if (!requestedRef.current) {
      return false;
    }
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(trigger, 0);
    return true;
  }, [trigger]);

  return { requestEdit, triggerIfRequested };
}
