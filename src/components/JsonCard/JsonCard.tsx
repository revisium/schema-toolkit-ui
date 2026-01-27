import { Box, Flex, Text } from '@chakra-ui/react';
import { githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import React, { useCallback, useRef, useState } from 'react';
import { CopyButton } from '../CopyButton/CopyButton';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

interface JsonCardProps {
  data: JsonValue;
  readonly?: boolean;
  onChange?: (data: JsonValue) => void;
  onBlur?: () => void;
  onCopy?: () => void;
}

export const JsonCard: React.FC<JsonCardProps> = ({
  data,
  readonly,
  onChange,
  onBlur,
  onCopy,
}) => {
  const [error, setError] = useState('');
  const externalText = JSON.stringify(data, null, 3);
  const [internalText, setInternalText] = useState(externalText);
  const isFocusedRef = useRef(false);

  const displayText = isFocusedRef.current ? internalText : externalText;

  const handleClick = useCallback(() => {
    void navigator.clipboard.writeText(displayText).then(() => {
      onCopy?.();
    });
  }, [displayText, onCopy]);

  const handleChange = useCallback(
    (value: string) => {
      setInternalText(value);

      try {
        const parsedData = JSON.parse(value) as JsonValue;
        setError('');
        onChange?.(parsedData);
      } catch (e) {
        console.error(e);
        setError('Invalid JSON');
      }
    },
    [onChange],
  );

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
    setInternalText(externalText);
  }, [externalText]);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
    setInternalText(externalText);
    onBlur?.();
  }, [onBlur, externalText]);

  const hoverStyles = {
    '&:hover .copy-button': { visibility: 'visible' as const },
  };

  return (
    <Flex
      position="relative"
      width="100%"
      flex={1}
      direction="column"
      gap="1rem"
      css={hoverStyles}
    >
      <Box p={1} flex={1}>
        <CodeMirror
          value={displayText}
          extensions={[EditorView.lineWrapping, json()]}
          editable={!readonly}
          theme={githubLight}
          maxWidth="100%"
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
          }}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <CopyButton
          dataTestId="json-card-copy-button"
          aria-label=""
          position="absolute"
          top="8px"
          right="8px"
          className="copy-button"
          visibility="hidden"
          onClick={handleClick}
        />
      </Box>
      <Flex
        height="40px"
        paddingBottom="8px"
        alignItems="flex-end"
        backgroundColor="white"
        width="100%"
        position="sticky"
        bottom={0}
        justifyContent="center"
      >
        <Text color="gray">{error}</Text>
      </Flex>
    </Flex>
  );
};
