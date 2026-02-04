import { Box, Input, Menu, Portal } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import React, { FC, useState } from 'react';
import { PiFunction, PiCaretRight } from 'react-icons/pi';
import type { BaseNodeVM } from '../../vm/node/BaseNodeVM';

interface FormulaSubmenuProps {
  viewModel: BaseNodeVM;
  dataTestId: string;
}

export const FormulaSubmenu: FC<FormulaSubmenuProps> = observer(
  ({ viewModel, dataTestId }) => {
    const [localValue, setLocalValue] = useState(viewModel.formula);

    const handleBlur = () => {
      viewModel.setFormula(localValue);
    };

    const stopPropagation = (e: React.KeyboardEvent | React.SyntheticEvent) => {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
    };

    return (
      <Menu.Root positioning={{ placement: 'right-start', gutter: 2 }}>
        <Menu.TriggerItem>
          <PiFunction />
          <Box flex="1">Formula</Box>
          {viewModel.hasFormula && (
            <Box
              color="gray.400"
              fontSize="xs"
              maxW="80px"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {viewModel.formula}
            </Box>
          )}
          <PiCaretRight />
        </Menu.TriggerItem>
        <Portal>
          <Menu.Positioner>
            <Menu.Content p="2" minW="280px">
              <Input
                size="sm"
                placeholder="e.g. price * quantity"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={stopPropagation}
                onKeyUp={stopPropagation}
                autoFocus
                data-testid={`${dataTestId}-formula-input`}
              />
              {localValue && (
                <Box fontSize="xs" color="gray.500" mt="1">
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
