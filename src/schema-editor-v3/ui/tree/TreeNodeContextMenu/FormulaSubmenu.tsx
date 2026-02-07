import { Box, Input, Menu, Portal } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import React, { FC, useRef, useState } from 'react';
import { PiFunction, PiCaretRight } from 'react-icons/pi';
import type { NodeAccessor } from '../../../model/accessor';

interface FormulaSubmenuProps {
  accessor: NodeAccessor;
  dataTestId: string;
}

export const FormulaSubmenu: FC<FormulaSubmenuProps> = observer(
  ({ accessor, dataTestId }) => {
    const [localValue, setLocalValue] = useState(accessor.formula.formula);
    const initialValueRef = useRef(accessor.formula.formula);

    const hasError = accessor.formula.hasError;
    const errorMessage = accessor.formula.errorMessage;

    const handleBlur = () => {
      if (localValue === initialValueRef.current) {
        return;
      }
      accessor.formula.setInputValue(localValue);
      accessor.formula.applyFormula();
    };

    const stopPropagation = (e: React.KeyboardEvent | React.SyntheticEvent) => {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
    };

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
            <Menu.Content minW="280px" p={2}>
              <Input
                size="sm"
                placeholder="e.g. price * quantity"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={stopPropagation}
                onKeyUp={stopPropagation}
                autoFocus
                borderColor={hasError ? 'red.300' : undefined}
                data-testid={`${dataTestId}-formula-input`}
              />
              {hasError && errorMessage && (
                <Box
                  fontSize="xs"
                  color="red.500"
                  mt={1}
                  data-testid={`${dataTestId}-formula-error`}
                >
                  {errorMessage}
                </Box>
              )}
              {!hasError && localValue && (
                <Box fontSize="xs" color="gray.500" mt={1}>
                  Field will be readOnly
                </Box>
              )}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    );
  },
);
