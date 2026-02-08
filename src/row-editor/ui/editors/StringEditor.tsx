import { FC, useCallback, useEffect, useState } from 'react';
import { PrimitiveBox } from './PrimitiveBox';

export interface StringEditorProps {
  value: string;
  setValue: (value: string) => void;
  readonly?: boolean;
  dataTestId?: string;
}

export const StringEditor: FC<StringEditorProps> = ({
  value,
  setValue,
  readonly,
  dataTestId,
}) => {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = useCallback((newValue: string) => {
    setInternalValue(newValue);
  }, []);

  const handleBlur = useCallback(() => {
    setValue(internalValue);
  }, [internalValue, setValue]);

  const prefix = internalValue ? '' : '"';

  return (
    <PrimitiveBox
      prefix={prefix}
      postfix={prefix}
      value={internalValue}
      readonly={readonly}
      dataTestId={dataTestId}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
};
