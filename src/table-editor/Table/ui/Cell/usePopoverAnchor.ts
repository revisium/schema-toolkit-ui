import { useCallback, useRef } from 'react';

interface PopoverAnchor {
  triggerRef: React.RefObject<HTMLDivElement | null>;
  getAnchorRect: () => DOMRect | null;
}

export function usePopoverAnchor(): PopoverAnchor {
  const triggerRef = useRef<HTMLDivElement>(null);
  const lastRectRef = useRef<DOMRect | null>(null);

  const getAnchorRect = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0) {
      lastRectRef.current = rect;
    }
    return lastRectRef.current;
  }, []);

  return { triggerRef, getAnchorRect };
}
