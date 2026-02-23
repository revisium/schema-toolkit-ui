import { useCallback, useEffect, useRef } from 'react';

export class ScrollShadowModel {
  showLeftShadow = false;
  showRightShadow = false;
  private _element: HTMLElement | null = null;
  private _paused = false;
  private _dirty = false;

  setElement(el: HTMLElement | null): void {
    this._element = el;
  }

  pause(): void {
    this._paused = true;
    this._dirty = false;
  }

  resume(): void {
    this._paused = false;
    if (this._dirty) {
      this._dirty = false;
      this._applyCssVars();
    }
  }

  update(left: boolean, right: boolean): void {
    this.showLeftShadow = left;
    this.showRightShadow = right;
    if (this._paused) {
      this._dirty = true;
      return;
    }
    this._applyCssVars();
  }

  reset(): void {
    this.showLeftShadow = false;
    this.showRightShadow = false;
    if (this._paused) {
      this._dirty = true;
      return;
    }
    this._applyCssVars();
  }

  private _applyCssVars(): void {
    if (this._element) {
      this._element.style.setProperty(
        '--shadow-left-opacity',
        this.showLeftShadow ? '1' : '0',
      );
      this._element.style.setProperty(
        '--shadow-right-opacity',
        this.showRightShadow ? '1' : '0',
      );
    }
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
  const roRef = useRef<ResizeObserver | null>(null);

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
    model.update(scrollLeft > 0, maxScroll > 1 && scrollLeft < maxScroll - 1);
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
      if (roRef.current) {
        roRef.current.disconnect();
        roRef.current = null;
      }
      if (el) {
        targetRef.current = el;
        el.addEventListener('scroll', handleScroll, { passive: true });
        rafRef.current = requestAnimationFrame(update);

        const scrollEl = getScrollElement(el);
        if (scrollEl) {
          const ro = new ResizeObserver(handleScroll);
          const table = scrollEl.querySelector('table');
          if (table) {
            ro.observe(table);
          }
          roRef.current = ro;
        }
      } else {
        targetRef.current = null;
        model.reset();
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
      if (roRef.current) {
        roRef.current.disconnect();
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleScroll]);

  return { model, setScrollerRef };
}
