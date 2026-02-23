import { useCallback, useEffect, useRef } from 'react';
import { makeAutoObservable, runInAction } from 'mobx';

export class ScrollShadowModel {
  showLeftShadow = false;
  showRightShadow = false;

  constructor() {
    makeAutoObservable(this);
  }

  update(left: boolean, right: boolean): void {
    this.showLeftShadow = left;
    this.showRightShadow = right;
  }

  reset(): void {
    this.showLeftShadow = false;
    this.showRightShadow = false;
  }
}

type ScrollTarget = HTMLElement | Window;

function getScrollElement(target: ScrollTarget): HTMLElement | null {
  if (target instanceof HTMLElement) {
    return target;
  }
  return document.scrollingElement as HTMLElement | null;
}

export function useScrollShadow(): {
  model: ScrollShadowModel;
  setScrollerRef: (el: ScrollTarget | null) => void;
} {
  const modelRef = useRef<ScrollShadowModel | null>(null);
  if (!modelRef.current) {
    modelRef.current = new ScrollShadowModel();
  }
  const model = modelRef.current;

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
    runInAction(() => {
      model.update(scrollLeft > 0, maxScroll > 1 && scrollLeft < maxScroll - 1);
    });
  }, [model]);

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
        runInAction(() => {
          model.reset();
        });
      }
    },
    [handleScroll, update, model],
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

  return { model, setScrollerRef };
}
