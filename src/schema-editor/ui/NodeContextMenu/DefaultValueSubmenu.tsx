import { Box, Input, Menu, Portal } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import React, { FC, useState } from 'react';
import { PiEquals, PiCaretRight } from 'react-icons/pi';
import type { BaseNodeVM } from '../../vm/BaseNodeVM';

interface DefaultValueSubmenuProps {
  viewModel: BaseNodeVM;
  dataTestId: string;
}

export const DefaultValueSubmenu: FC<DefaultValueSubmenuProps> = observer(
  ({ viewModel, dataTestId }) => {
    const [localValue, setLocalValue] = useState(
      viewModel.defaultValueAsString,
    );

    const handleBlur = () => {
      viewModel.setDefault(localValue);
    };

    const handleBooleanChange = (checked: boolean) => {
      viewModel.setDefault(checked ? 'true' : 'false');
    };

    const stopPropagation = (e: React.KeyboardEvent | React.SyntheticEvent) => {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
    };

    return (
      <Menu.Root positioning={{ placement: 'right-start', gutter: 2 }}>
        <Menu.TriggerItem>
          <PiEquals />
          <Box flex="1">Default value</Box>
          {viewModel.defaultValueAsString && (
            <Box
              color="gray.400"
              fontSize="xs"
              maxW="80px"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {viewModel.defaultValueAsString}
            </Box>
          )}
          <PiCaretRight />
        </Menu.TriggerItem>
        <Portal>
          <Menu.Positioner>
            <Menu.Content p="2" minW="200px">
              {viewModel.isBoolean ? (
                <Menu.CheckboxItem
                  value="default-true"
                  checked={viewModel.defaultValue === true}
                  onCheckedChange={() =>
                    handleBooleanChange(viewModel.defaultValue !== true)
                  }
                  data-testid={`${dataTestId}-default-checkbox`}
                >
                  true
                  <Menu.ItemIndicator />
                </Menu.CheckboxItem>
              ) : (
                <Input
                  size="sm"
                  type={viewModel.isNumber ? 'number' : 'text'}
                  placeholder={viewModel.isNumber ? '0' : 'default value'}
                  value={localValue}
                  onChange={(e) => setLocalValue(e.target.value)}
                  onBlur={handleBlur}
                  onKeyDown={stopPropagation}
                  onKeyUp={stopPropagation}
                  autoFocus
                  data-testid={`${dataTestId}-default-input`}
                />
              )}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    );
  },
);
