import { Box, Text } from '@chakra-ui/react';
import React, { useCallback, useRef, useState } from 'react';
import { useContentEditable } from '../../hooks/useContentEditable';
import { Tooltip } from '../Tooltip';
import { type BreadcrumbEditableProps } from './Breadcrumbs';
import {
  BREADCRUMB_BORDER_RADIUS,
  BREADCRUMB_PADDING,
  CURRENT_COLOR,
  HOVER_BG,
} from './constants';

export const EditableSegment: React.FC<BreadcrumbEditableProps> = ({
  value,
  onChange,
  onBlur,
  tooltip,
  placeholder,
  dataTestId,
}) => {
  const [focused, setFocused] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;

  const handleFocus = useCallback(() => {
    setFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setFocused(false);
    onBlurRef.current?.(valueRef.current);
  }, []);

  const editableProps = useContentEditable({
    value,
    onChange,
    onBlur: handleBlur,
    onFocus: handleFocus,
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

  const showPlaceholder = !value && !focused && !!placeholder;

  const box = (
    <Box
      borderRadius={BREADCRUMB_BORDER_RADIUS}
      px={BREADCRUMB_PADDING}
      py={BREADCRUMB_PADDING}
      bg={focused || showPlaceholder ? HOVER_BG : undefined}
      _hover={{ bg: HOVER_BG }}
      cursor="text"
      onClick={handleParentClick}
      position="relative"
    >
      {showPlaceholder && (
        <Text
          pointerEvents="none"
          userSelect="none"
          whiteSpace="nowrap"
          color="gray.400"
          fontWeight="400"
        >
          {placeholder}
        </Text>
      )}
      <Box
        ref={combinedRef}
        color={CURRENT_COLOR}
        fontWeight="600"
        outline={0}
        whiteSpace="nowrap"
        data-testid={dataTestId}
        contentEditable={editableProps.contentEditable}
        spellCheck={editableProps.spellCheck}
        dangerouslySetInnerHTML={editableProps.dangerouslySetInnerHTML}
        onInput={editableProps.onInput}
        onBlur={editableProps.onBlur}
        onFocus={editableProps.onFocus}
        onKeyDown={editableProps.onKeyDown}
        {...(showPlaceholder
          ? { position: 'absolute' as const, inset: 0 }
          : {})}
      />
    </Box>
  );

  if (tooltip) {
    return (
      <Tooltip
        content={tooltip}
        openDelay={300}
        open={focused ? false : undefined}
        closeOnClick={false}
      >
        {box}
      </Tooltip>
    );
  }

  return box;
};
