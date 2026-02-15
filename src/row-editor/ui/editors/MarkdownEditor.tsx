import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Box, Textarea } from '@chakra-ui/react';

export interface MarkdownEditorProps {
  value: string;
  setValue: (value: string) => void;
  readonly?: boolean;
  dataTestId?: string;
}

export const MarkdownEditor: FC<MarkdownEditorProps> = ({
  value,
  setValue,
  readonly,
  dataTestId,
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInternalValue(e.target.value);
    },
    [],
  );

  const handleBlur = useCallback(() => {
    setValue(internalValue);
  }, [internalValue, setValue]);

  return (
    <Box mt="2px" ml="2px" pr="4px" width="100%">
      <Textarea
        ref={textareaRef}
        value={internalValue}
        onChange={handleChange}
        onBlur={handleBlur}
        readOnly={readonly}
        data-testid={dataTestId}
        fontFamily="mono"
        fontSize="13px"
        lineHeight="1.5"
        minHeight="120px"
        resize="vertical"
        borderColor="gray.200"
        _focus={{
          borderColor: 'blue.400',
          boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
        }}
        placeholder="Markdown content..."
      />
    </Box>
  );
};
