import { FC, useCallback, useEffect, useState, useRef } from 'react';
import { PrimitiveBox } from './PrimitiveBox';

const NUMERIC_CHARS = /^[\d.eE+-]+$/;

export interface NumberEditorProps {
  value: number;
  setValue: (value: number) => void;
  readonly?: boolean;
  dataTestId?: string;
}

export const NumberEditor: FC<NumberEditorProps> = ({
  value,
  setValue,
  readonly,
  dataTestId,
}) => {
  const stringValue = value.toString();
  const lastValidValue = useRef(stringValue);

  const [state, setState] = useState(stringValue);

  useEffect(() => {
    setState(stringValue);
    lastValidValue.current = stringValue;
  }, [stringValue]);

  const handleChange = useCallback((newValue: string) => {
    setState(newValue);
  }, []);

  const handleBlur = useCallback(() => {
    const trimmed = state.trim();
    const parsedValue = Number(trimmed);

    if (trimmed !== '' && Number.isFinite(parsedValue)) {
      setValue(parsedValue);
      setState(parsedValue.toString());
      lastValidValue.current = parsedValue.toString();
    } else {
      setState(lastValidValue.current);
    }
  }, [setValue, state]);

  return (
    <PrimitiveBox
      value={state}
      readonly={readonly}
      dataTestId={dataTestId}
      onChange={handleChange}
      onBlur={handleBlur}
      restrict={NUMERIC_CHARS}
    />
  );
};
