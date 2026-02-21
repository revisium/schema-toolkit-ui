import { useCallback, useEffect, useRef, useState } from 'react';

export interface ScrollShadowState {
  showLeftShadow: boolean;
  showRightShadow: boolean;
}

type ScrollTarget = HTMLElement | Window;

const INITIAL_STATE: ScrollShadowState = {
  showLeftShadow: false,
  showRightShadow: false,
};

function getScrollElement(target: ScrollTarget): HTMLElement | null {
  if (target instanceof HTMLElement) {
    return target;
  }
  return document.scrollingElement as HTMLElement | null;
}

export function useScrollShadow(): {
  state: ScrollShadowState;
  setScrollerRef: (el: ScrollTarget | null) => void;
} {
  const [state, setState] = useState<ScrollShadowState>(INITIAL_STATE);
  const targetRef = useRef<ScrollTarget | null>(null);
  const rafRef = useRef<number>(0);

  const update = useCallback(() => {
    const target = targetRef.current;
    if (!target) {
      return;
    }
    const el = getScrollElement(target);
    if (!el) {
      return;
    }
    const scrollLeft = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setState({
      showLeftShadow: scrollLeft > 0,
      showRightShadow: maxScroll > 1 && scrollLeft < maxScroll - 1,
    });
  }, []);

  const handleScroll = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(update);
  }, [update]);

  const setScrollerRef = useCallback(
    (el: ScrollTarget | null) => {
      const prev = targetRef.current;
      if (prev) {
        prev.removeEventListener('scroll', handleScroll);
      }
      if (el) {
        targetRef.current = el;
        el.addEventListener('scroll', handleScroll, { passive: true });
        rafRef.current = requestAnimationFrame(update);
      } else {
        targetRef.current = null;
        setState(INITIAL_STATE);
      }
    },
    [handleScroll, update],
  );

  useEffect(() => {
    return () => {
      const prev = targetRef.current;
      if (prev) {
        prev.removeEventListener('scroll', handleScroll);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleScroll]);

  return { state, setScrollerRef };
}
