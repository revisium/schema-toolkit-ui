import { Box, Menu, Portal, Textarea } from '@chakra-ui/react';
import {
  validateFormulaAgainstSchema,
  type JsonObjectSchema,
} from '@revisium/schema-toolkit';
import { observer } from 'mobx-react-lite';
import React, { FC, useEffect, useRef, useState } from 'react';
import { PiFunction, PiCaretRight } from 'react-icons/pi';
import type { NodeAccessor } from '../../../model/accessor';

interface FormulaSubmenuProps {
  accessor: NodeAccessor;
  dataTestId: string;
}

const validateLocally = (
  value: string,
  fieldName: string,
  plainSchema: JsonObjectSchema,
): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const error = validateFormulaAgainstSchema(trimmed, fieldName, plainSchema);
    return error ? error.error : null;
  } catch {
    return 'Invalid formula';
  }
};

const FormulaInput: FC<{
  accessor: NodeAccessor;
  dataTestId: string;
}> = observer(({ accessor, dataTestId }) => {
  const initialValue = accessor.formula.formula;
  const initialError = accessor.formula.errorMessage ?? null;
  const [localValue, setLocalValue] = useState(initialValue);
  const [localError, setLocalError] = useState<string | null>(initialError);
  const localValueRef = useRef(localValue);
  const initialValueRef = useRef(initialValue);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalValue(value);
    localValueRef.current = value;
    const error = validateLocally(
      value,
      accessor.label.name,
      accessor.formula.plainSchema,
    );
    setLocalError(error);
  };

  useEffect(() => {
    const accessorRef = accessor;
    const initialRef = initialValueRef;
    return () => {
      const value = localValueRef.current;
      if (value === initialRef.current) {
        return;
      }
      accessorRef.formula.setInputValue(value);
      accessorRef.formula.applyFormula();
    };
  }, [accessor]);

  const hasError = localError !== null;

  const stopPropagation = (e: React.KeyboardEvent | React.SyntheticEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  };

  return (
    <>
      <Textarea
        size="sm"
        placeholder="e.g. price * quantity"
        value={localValue}
        onChange={handleChange}
        onKeyDown={stopPropagation}
        onKeyUp={stopPropagation}
        autoFocus
        onFocus={(e) => {
          const len = e.currentTarget.value.length;
          e.currentTarget.setSelectionRange(len, len);
        }}
        rows={2}
        borderColor={hasError ? 'red.300' : undefined}
        data-testid={`${dataTestId}-formula-input`}
      />
      {hasError && (
        <Box
          fontSize="xs"
          color="red.500"
          mt={1}
          data-testid={`${dataTestId}-formula-error`}
        >
          {localError}
        </Box>
      )}
      {!hasError && localValue && (
        <Box fontSize="xs" color="gray.500" mt={1}>
          Field will be readOnly
        </Box>
      )}
    </>
  );
});

export const FormulaSubmenu: FC<FormulaSubmenuProps> = observer(
  ({ accessor, dataTestId }) => {
    const hasError = accessor.formula.hasError;

    return (
      <Menu.Root positioning={{ placement: 'right-start', gutter: 2 }}>
        <Menu.TriggerItem data-testid={`${dataTestId}-formula-menu`}>
          <PiFunction />
          <Box flex="1">Formula</Box>
          {accessor.formula.hasFormula && (
            <Box
              color={hasError ? 'red.400' : 'gray.400'}
              fontSize="xs"
              maxW="80px"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {accessor.formula.formula}
            </Box>
          )}
          <PiCaretRight />
        </Menu.TriggerItem>
        <Portal>
          <Menu.Positioner>
            <Menu.Content w="280px" p={2}>
              <FormulaInput accessor={accessor} dataTestId={dataTestId} />
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    );
  },
);
