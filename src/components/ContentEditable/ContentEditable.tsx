import { Box, BoxProps, Flex, Text } from '@chakra-ui/react';
import React, { useCallback, useRef } from 'react';
import {
  useContentEditable,
  type UseContentEditableOptions,
} from '../../hooks/useContentEditable';

export interface ContentEditableProps extends Pick<
  UseContentEditableOptions,
  | 'onChange'
  | 'onBlur'
  | 'onFocus'
  | 'onEscape'
  | 'onEnter'
  | 'restrict'
  | 'autoFocus'
  | 'focusTrigger'
> {
  initValue: string;
  placeholder?: string;
  prefix?: string;
  postfix?: string;
  dataTestId?: string;
  textDecoration?: BoxProps['textDecoration'];
}

export const ContentEditable: React.FC<ContentEditableProps> = ({
  initValue,
  placeholder,
  autoFocus,
  onBlur,
  onChange,
  onEscape,
  onEnter,
  onFocus,
  focusTrigger,
  restrict,
  prefix,
  postfix,
  dataTestId,
  textDecoration,
}) => {
  const elementRef = useRef<HTMLElement | null>(null);

  const editableProps = useContentEditable({
    value: initValue,
    onChange,
    onBlur,
    onFocus,
    onEscape,
    onEnter,
    restrict,
    autoFocus,
    focusTrigger,
  });

  const hookRef = editableProps.ref;
  const combinedRef = useCallback(
    (node: HTMLElement | null) => {
      elementRef.current = node;
      hookRef(node);
    },
    [hookRef],
  );

  const handleParentClick = useCallback(() => {
    elementRef.current?.focus();
  }, []);

  const showPlaceholder = !initValue && placeholder;

  return (
    <Flex
      minWidth={0}
      width={showPlaceholder ? '100%' : undefined}
      position="relative"
      cursor="text"
      onClick={handleParentClick}
    >
      {!showPlaceholder && prefix}
      <Box
        color="blackAlpha.800"
        textDecoration={textDecoration}
        data-testid={dataTestId}
        ref={combinedRef}
        contentEditable={editableProps.contentEditable}
        spellCheck={editableProps.spellCheck}
        dangerouslySetInnerHTML={editableProps.dangerouslySetInnerHTML}
        outline={0}
        width="100%"
        onBlur={editableProps.onBlur}
        onFocus={editableProps.onFocus}
        onInput={editableProps.onInput}
        onKeyDown={editableProps.onKeyDown}
      ></Box>
      {!showPlaceholder && postfix}
      {showPlaceholder && (
        <Text
          cursor="text"
          userSelect="none"
          pointerEvents="none"
          whiteSpace="nowrap"
          color="gray.400"
          position="absolute"
        >
          {placeholder}
        </Text>
      )}
    </Flex>
  );
};
