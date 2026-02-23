import { useCallback, useEffect, useRef, useState } from 'react';

export interface ShadowState {
  left: boolean;
  right: boolean;
}

const INITIAL_SHADOW: ShadowState = { left: false, right: false };

export class ScrollShadowModel {
  private _left = false;
  private _right = false;
  private _paused = false;
  private _dirty = false;
  private _onChange: ((state: ShadowState) => void) | null = null;

  get showLeftShadow(): boolean {
    return this._left;
  }

  get showRightShadow(): boolean {
    return this._right;
  }

  setOnChange(cb: ((state: ShadowState) => void) | null): void {
    this._onChange = cb;
  }

  pause(): void {
    this._paused = true;
    this._dirty = false;
  }

  resume(): void {
    this._paused = false;
    if (this._dirty) {
      this._dirty = false;
      this._notify();
    }
  }

  update(left: boolean, right: boolean): void {
    if (this._left === left && this._right === right) {
      return;
    }
    this._left = left;
    this._right = right;
    if (this._paused) {
      this._dirty = true;
      return;
    }
    this._notify();
  }

  reset(): void {
    if (!this._left && !this._right) {
      return;
    }
    this._left = false;
    this._right = false;
    if (this._paused) {
      this._dirty = true;
      return;
    }
    this._notify();
  }

  private _notify(): void {
    if (this._onChange) {
      this._onChange({ left: this._left, right: this._right });
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
  shadowCssVars: Record<string, string>;
  shadowModel: ScrollShadowModel;
  setScrollerRef: (el: ScrollTarget | null) => void;
} {
  const modelRef = useRef<ScrollShadowModel | null>(null);
  if (!modelRef.current) {
    modelRef.current = new ScrollShadowModel();
  }
  const model = modelRef.current;

  const [shadow, setShadow] = useState<ShadowState>(INITIAL_SHADOW);

  model.setOnChange(setShadow);

  useEffect(() => {
    return () => {
      model.setOnChange(null);
    };
  }, [model]);

  const shadowCssVars: Record<string, string> = {
    '--shadow-left-opacity': shadow.left ? '1' : '0',
    '--shadow-right-opacity': shadow.right ? '1' : '0',
  };

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

  return { shadowCssVars, shadowModel: model, setScrollerRef };
}
