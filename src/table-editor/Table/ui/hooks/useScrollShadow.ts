import { useCallback, useEffect, useRef, useState } from 'react';

export interface ScrollShadowState {
  showLeftShadow: boolean;
  showRightShadow: boolean;
}

const INITIAL_STATE: ScrollShadowState = {
  showLeftShadow: false,
  showRightShadow: false,
};

export function useScrollShadow(): {
  state: ScrollShadowState;
  setScrollerRef: (el: HTMLElement | Window | null) => void;
} {
  const [state, setState] = useState<ScrollShadowState>(INITIAL_STATE);
  const scrollerRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number>(0);

  const update = useCallback(() => {
    const el = scrollerRef.current;
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
    (el: HTMLElement | Window | null) => {
      const prev = scrollerRef.current;
      if (prev) {
        prev.removeEventListener('scroll', handleScroll);
      }
      if (el instanceof HTMLElement) {
        scrollerRef.current = el;
        el.addEventListener('scroll', handleScroll, { passive: true });
        rafRef.current = requestAnimationFrame(update);
      } else {
        scrollerRef.current = null;
        setState(INITIAL_STATE);
      }
    },
    [handleScroll, update],
  );

  useEffect(() => {
    return () => {
      const prev = scrollerRef.current;
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
