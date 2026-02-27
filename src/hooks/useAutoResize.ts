import { useEffect, useRef } from 'react';

const MIN_HEIGHT = 120;

export function useAutoResize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, MIN_HEIGHT)}px`;
  }, [value]);

  return ref;
}
