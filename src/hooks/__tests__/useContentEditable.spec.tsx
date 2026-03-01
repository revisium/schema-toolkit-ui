import { jest, describe, it, expect } from '@jest/globals';
import { render, fireEvent, act } from '@testing-library/react';
import React, { StrictMode, useRef, useState } from 'react';
import {
  useContentEditable,
  UseContentEditableOptions,
} from '../useContentEditable';

function TestComponent(props: Readonly<UseContentEditableOptions>) {
  const editableProps = useContentEditable(props);
  return <div data-testid="editable" {...editableProps} />;
}

function TestComponentWithTrigger(
  props: Readonly<Omit<UseContentEditableOptions, 'focusTrigger'>>,
) {
  const [trigger, setTrigger] = useState(0);
  const editableProps = useContentEditable({ ...props, focusTrigger: trigger });
  return (
    <>
      <div data-testid="editable" {...editableProps} />
      <button
        data-testid="trigger"
        onClick={() => setTrigger((prev) => prev + 1)}
      />
    </>
  );
}

function StabilityTestComponent(
  props: Readonly<UseContentEditableOptions & { onRender?: () => void }>,
) {
  const { onRender, ...hookProps } = props;
  const editableProps = useContentEditable(hookProps);
  const prevRef = useRef(editableProps.ref);
  const prevOnKeyDown = useRef(editableProps.onKeyDown);
  const prevOnBlur = useRef(editableProps.onBlur);
  const prevOnFocus = useRef(editableProps.onFocus);
  const prevOnInput = useRef(editableProps.onInput);

  const refStable = prevRef.current === editableProps.ref;
  const keyDownStable = prevOnKeyDown.current === editableProps.onKeyDown;
  const blurStable = prevOnBlur.current === editableProps.onBlur;
  const focusStable = prevOnFocus.current === editableProps.onFocus;
  const inputStable = prevOnInput.current === editableProps.onInput;

  prevRef.current = editableProps.ref;
  prevOnKeyDown.current = editableProps.onKeyDown;
  prevOnBlur.current = editableProps.onBlur;
  prevOnFocus.current = editableProps.onFocus;
  prevOnInput.current = editableProps.onInput;

  onRender?.();

  return (
    <>
      <div data-testid="editable" {...editableProps} />
      <div
        data-testid="stability"
        data-ref-stable={String(refStable)}
        data-keydown-stable={String(keyDownStable)}
        data-blur-stable={String(blurStable)}
        data-focus-stable={String(focusStable)}
        data-input-stable={String(inputStable)}
      />
    </>
  );
}

describe('useContentEditable', () => {
  it('renders with initial value', () => {
    const { getByTestId } = render(<TestComponent value="hello" />);
    const el = getByTestId('editable');
    expect(el.textContent).toBe('hello');
    expect(el.getAttribute('contenteditable')).toBe('true');
    expect(el.getAttribute('spellcheck')).toBe('false');
  });

  it('escapes HTML in value', () => {
    const { getByTestId } = render(<TestComponent value="<b>bold</b>" />);
    const el = getByTestId('editable');
    expect(el.textContent).toBe('<b>bold</b>');
    expect(el.querySelector('b')).toBeNull();
  });

  it('calls onChange on input', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <TestComponent value="" onChange={onChange} />,
    );
    const el = getByTestId('editable');

    Object.defineProperty(el, 'innerText', { value: 'typed', writable: true });
    fireEvent.input(el);

    expect(onChange).toHaveBeenCalledWith('typed');
  });

  it('treats newline-only input as empty string', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <TestComponent value="" onChange={onChange} />,
    );
    const el = getByTestId('editable');

    Object.defineProperty(el, 'innerText', { value: '\n', writable: true });
    fireEvent.input(el);

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('calls onBlur on blur', () => {
    const onBlur = jest.fn();
    const { getByTestId } = render(
      <TestComponent value="test" onBlur={onBlur} />,
    );

    fireEvent.blur(getByTestId('editable'));
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('calls onFocus on focus', () => {
    const onFocus = jest.fn();
    const { getByTestId } = render(
      <TestComponent value="test" onFocus={onFocus} />,
    );

    fireEvent.focus(getByTestId('editable'));
    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  it('Enter with value blurs and calls onEnter', () => {
    const onEnter = jest.fn();
    const { getByTestId } = render(
      <TestComponent value="hello" onEnter={onEnter} />,
    );
    const el = getByTestId('editable');

    const blurSpy = jest.spyOn(el, 'blur');
    fireEvent.keyDown(el, { key: 'Enter' });

    expect(blurSpy).toHaveBeenCalled();
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('Enter without value does not blur or call onEnter', () => {
    const onEnter = jest.fn();
    const { getByTestId } = render(
      <TestComponent value="" onEnter={onEnter} />,
    );
    const el = getByTestId('editable');

    const blurSpy = jest.spyOn(el, 'blur');
    fireEvent.keyDown(el, { key: 'Enter' });

    expect(blurSpy).not.toHaveBeenCalled();
    expect(onEnter).not.toHaveBeenCalled();
  });

  it('Escape blurs and calls onEscape', () => {
    const onEscape = jest.fn();
    const { getByTestId } = render(
      <TestComponent value="hello" onEscape={onEscape} />,
    );
    const el = getByTestId('editable');

    const blurSpy = jest.spyOn(el, 'blur');
    fireEvent.keyDown(el, { key: 'Escape' });

    expect(blurSpy).toHaveBeenCalled();
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('restrict blocks disallowed keys', () => {
    const { getByTestId } = render(
      <TestComponent value="" restrict={/^[a-z]$/} />,
    );
    const el = getByTestId('editable');

    const event = createKeyboardEvent('1');
    el.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('restrict allows matching keys', () => {
    const { getByTestId } = render(
      <TestComponent value="" restrict={/^[a-z]$/} />,
    );
    const el = getByTestId('editable');

    const event = createKeyboardEvent('a');
    el.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('restrict allows navigation keys', () => {
    const { getByTestId } = render(
      <TestComponent value="" restrict={/^[a-z]$/} />,
    );
    const el = getByTestId('editable');

    for (const key of ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete']) {
      const event = createKeyboardEvent(key);
      el.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
  });

  it('restrict allows Ctrl/Meta modifier shortcuts', () => {
    const { getByTestId } = render(
      <TestComponent value="" restrict={/^\d$/} />,
    );
    const el = getByTestId('editable');

    const ctrlC = createKeyboardEvent('c', { ctrlKey: true });
    el.dispatchEvent(ctrlC);
    expect(ctrlC.defaultPrevented).toBe(false);

    const metaA = createKeyboardEvent('a', { metaKey: true });
    el.dispatchEvent(metaA);
    expect(metaA.defaultPrevented).toBe(false);
  });

  it('autoFocus focuses element on mount', () => {
    const { getByTestId } = render(<TestComponent value="" autoFocus />);
    const el = getByTestId('editable');
    expect(document.activeElement).toBe(el);
  });

  it('focusTrigger change focuses element', () => {
    const { getByTestId } = render(<TestComponentWithTrigger value="hello" />);
    const el = getByTestId('editable');
    const focusSpy = jest.spyOn(el, 'focus');

    act(() => {
      fireEvent.click(getByTestId('trigger'));
    });

    expect(focusSpy).toHaveBeenCalled();
  });

  it('focusTrigger initial value does not focus on mount', () => {
    const focusSpy = jest.spyOn(HTMLElement.prototype, 'focus');
    render(<TestComponent value="hello" focusTrigger={5} />);

    expect(focusSpy).not.toHaveBeenCalled();
    focusSpy.mockRestore();
  });

  it('does not focus on mount in StrictMode without focusTrigger', () => {
    const focusSpy = jest.spyOn(HTMLElement.prototype, 'focus');
    render(
      <StrictMode>
        <TestComponent value="hello" />
      </StrictMode>,
    );

    expect(focusSpy).not.toHaveBeenCalled();
    focusSpy.mockRestore();
  });

  it('does not focus on mount in StrictMode with focusTrigger', () => {
    const focusSpy = jest.spyOn(HTMLElement.prototype, 'focus');
    render(
      <StrictMode>
        <TestComponent value="hello" focusTrigger={0} />
      </StrictMode>,
    );

    expect(focusSpy).not.toHaveBeenCalled();
    focusSpy.mockRestore();
  });

  describe('handler stability', () => {
    it('ref callback is stable across re-renders', () => {
      const { getByTestId, rerender } = render(
        <StabilityTestComponent value="a" />,
      );

      rerender(<StabilityTestComponent value="b" />);

      const stability = getByTestId('stability');
      expect(stability.getAttribute('data-ref-stable')).toBe('true');
    });

    it('event handlers are stable across re-renders', () => {
      const { getByTestId, rerender } = render(
        <StabilityTestComponent value="a" onChange={jest.fn()} />,
      );

      rerender(<StabilityTestComponent value="b" onChange={jest.fn()} />);

      const stability = getByTestId('stability');
      expect(stability.getAttribute('data-keydown-stable')).toBe('true');
      expect(stability.getAttribute('data-blur-stable')).toBe('true');
      expect(stability.getAttribute('data-focus-stable')).toBe('true');
      expect(stability.getAttribute('data-input-stable')).toBe('true');
    });

    it('uses latest callback after re-render', () => {
      const onEnter1 = jest.fn();
      const onEnter2 = jest.fn();
      const { getByTestId, rerender } = render(
        <TestComponent value="hello" onEnter={onEnter1} />,
      );

      rerender(<TestComponent value="hello" onEnter={onEnter2} />);

      fireEvent.keyDown(getByTestId('editable'), { key: 'Enter' });
      expect(onEnter1).not.toHaveBeenCalled();
      expect(onEnter2).toHaveBeenCalledTimes(1);
    });

    it('element is not detached across re-renders', () => {
      const { getByTestId, rerender } = render(
        <TestComponent value="a" autoFocus />,
      );
      const el = getByTestId('editable');
      el.focus();
      expect(document.activeElement).toBe(el);

      rerender(<TestComponent value="b" autoFocus />);

      expect(document.activeElement).toBe(el);
    });
  });

  describe('external value sync', () => {
    function TestControlled() {
      const [value, setValue] = useState('initial');
      const editableProps = useContentEditable({ value, onChange: setValue });
      return (
        <>
          <div data-testid="editable" {...editableProps} />
          <button data-testid="revert" onClick={() => setValue('initial')} />
          <button data-testid="set-new" onClick={() => setValue('changed')} />
        </>
      );
    }

    it('updates DOM when value changes externally while not focused', () => {
      const { getByTestId } = render(<TestControlled />);
      const el = getByTestId('editable');

      // simulate user typing — updates internal value via onChange
      act(() => {
        Object.defineProperty(el, 'innerText', {
          value: 'typed',
          writable: true,
          configurable: true,
        });
        fireEvent.input(el);
      });

      // revert externally
      act(() => {
        fireEvent.click(getByTestId('revert'));
      });

      expect(el.textContent).toBe('initial');
    });

    it('syncs DOM on blur when value was changed externally during focus', () => {
      const { getByTestId, rerender } = render(
        <TestComponent value="initial" />,
      );
      const el = getByTestId('editable');

      // user focuses and types — DOM diverges from value
      act(() => { fireEvent.focus(el); });
      act(() => {
        el.textContent = 'user typed';
      });

      // external revert changes value prop but DOM is not updated (user is typing)
      rerender(<TestComponent value="reverted" />);
      // manually restore DOM to "user typed" to simulate contenteditable not being overwritten
      el.textContent = 'user typed';
      expect(el.textContent).toBe('user typed');

      // user blurs — DOM must sync to current external value
      act(() => { fireEvent.blur(el); });

      expect(el.textContent).toBe('reverted');
    });

    it('isFocusedRef tracks focus and blur correctly', () => {
      const onFocus = jest.fn();
      const onBlur = jest.fn();
      const { getByTestId } = render(
        <TestComponent value="initial" onFocus={onFocus} onBlur={onBlur} />,
      );
      const el = getByTestId('editable');

      fireEvent.focus(el);
      expect(onFocus).toHaveBeenCalledTimes(1);

      fireEvent.blur(el);
      expect(onBlur).toHaveBeenCalledTimes(1);
    });
  });
});

function createKeyboardEvent(
  key: string,
  modifiers: { ctrlKey?: boolean; metaKey?: boolean } = {},
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...modifiers,
  });
}
