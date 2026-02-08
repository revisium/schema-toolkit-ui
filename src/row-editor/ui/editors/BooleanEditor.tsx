import { FC, useCallback, useEffect, useState } from 'react';
import { PrimitiveBox } from './PrimitiveBox';
import { BooleanMenu } from './BooleanMenu';

export interface BooleanEditorProps {
  value: boolean;
  setValue: (value: boolean) => void;
  readonly?: boolean;
  dataTestId?: string;
}

export const BooleanEditor: FC<BooleanEditorProps> = ({
  value,
  setValue,
  readonly,
  dataTestId,
}) => {
  const stringValue = value.toString();

  const [state, setState] = useState(stringValue);

  useEffect(() => {
    setState(stringValue);
  }, [stringValue]);

  const handleChange = useCallback((value: string) => {
    setState(value);
  }, []);

  const handleBlur = useCallback(() => {
    const trimmed = state.trim();
    const boolValue =
      trimmed.toLowerCase() === 'false' || trimmed === '0'
        ? false
        : Boolean(trimmed);
    setState(boolValue.toString());
    setValue(boolValue);
  }, [setValue, state]);

  const handleBooleanSelect = useCallback(
    (boolValue: boolean) => {
      setState(boolValue.toString());
      setValue(boolValue);
    },
    [setValue],
  );

  return (
    <BooleanMenu onChange={handleBooleanSelect} disabled={readonly}>
      <PrimitiveBox
        value={state}
        readonly={readonly}
        dataTestId={dataTestId}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    </BooleanMenu>
  );
};
