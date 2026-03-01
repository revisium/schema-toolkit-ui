import {
  FocusEventHandler,
  FormEventHandler,
  KeyboardEventHandler,
  RefCallback,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';

export interface UseContentEditableOptions {
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onEscape?: () => void;
  onEnter?: () => void;
  restrict?: RegExp;
  autoFocus?: boolean;
  focusTrigger?: number;
}

export type UseContentEditableReturn = {
  ref: RefCallback<HTMLElement>;
  contentEditable: true;
  spellCheck: false;
  dangerouslySetInnerHTML: { __html: string };
  onInput: FormEventHandler<HTMLElement>;
  onBlur: FormEventHandler<HTMLElement>;
  onFocus: FocusEventHandler<HTMLElement>;
  onKeyDown: KeyboardEventHandler<HTMLElement>;
};

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const allowed = new Set([
  'Backspace',
  'Escape',
  'Enter',
  'ArrowRight',
  'ArrowLeft',
  'Delete',
]);

export function useContentEditable(
  options: UseContentEditableOptions,
): UseContentEditableReturn {
  const { value, autoFocus, focusTrigger } = options;

  const elementRef = useRef<HTMLElement | null>(null);
  const cursorPosition = useRef<number | null>(null);
  const prevFocusTriggerRef = useRef(focusTrigger);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const isFocusedRef = useRef(false);

  useEffect(() => {
    const el = elementRef.current;
    if (el && !isFocusedRef.current && el.textContent !== value) {
      el.innerText = value;
    }
  }, [value]);

  const ref: RefCallback<HTMLElement> = useCallback((node) => {
    elementRef.current = node;
  }, []);

  useEffect(() => {
    if (autoFocus) {
      elementRef.current?.focus();
    }
  }, [autoFocus]);

  useLayoutEffect(() => {
    const selection = globalThis.getSelection();
    if (selection && cursorPosition.current !== null && elementRef.current) {
      const maxPosition = (elementRef.current.textContent || '').length;
      const position = Math.min(maxPosition, cursorPosition.current);

      const range = document.createRange();
      const sel = globalThis.getSelection();
      const firstChild = elementRef.current.childNodes[0];
      const node: Node = firstChild ?? elementRef.current;
      range.setStart(node, position);
      range.collapse(true);

      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  });

  useEffect(() => {
    if (prevFocusTriggerRef.current === focusTrigger) {
      return;
    }
    prevFocusTriggerRef.current = focusTrigger;

    elementRef.current?.focus();
    const selection = globalThis.getSelection();

    if (elementRef.current && selection) {
      const range = document.createRange();
      range.selectNodeContents(elementRef.current);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, [focusTrigger]);

  const handleInput: FormEventHandler<HTMLElement> = useCallback((event) => {
    const selection = globalThis.getSelection();
    if (selection && selection.rangeCount > 0) {
      cursorPosition.current = selection.getRangeAt(0).startOffset;
    }

    const textValue = event.currentTarget.innerText;
    const val = textValue === '\n' ? '' : textValue;
    optionsRef.current.onChange?.(val);
  }, []);

  const handleBlur: FormEventHandler<HTMLElement> = useCallback(() => {
    isFocusedRef.current = false;
    optionsRef.current.onBlur?.();
    cursorPosition.current = null;
  }, []);

  const handleFocus: FocusEventHandler<HTMLElement> = useCallback(() => {
    isFocusedRef.current = true;
    optionsRef.current.onFocus?.();
  }, []);

  const handleKeyDown: KeyboardEventHandler<HTMLElement> = useCallback(
    (event) => {
      const opts = optionsRef.current;

      if (event.key === 'Enter') {
        event.preventDefault();

        if (opts.value) {
          elementRef.current?.blur();
          opts.onEnter?.();
        }
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        elementRef.current?.blur();
        opts.onEscape?.();
      }

      if (
        opts.restrict &&
        !event.metaKey &&
        !event.ctrlKey &&
        !allowed.has(event.key) &&
        !opts.restrict.test(event.key)
      ) {
        event.preventDefault();
      }
    },
    [],
  );

  return {
    ref,
    contentEditable: true,
    spellCheck: false,
    dangerouslySetInnerHTML: { __html: escapeHtml(value) },
    onInput: handleInput,
    onBlur: handleBlur,
    onFocus: handleFocus,
    onKeyDown: handleKeyDown,
  };
}
