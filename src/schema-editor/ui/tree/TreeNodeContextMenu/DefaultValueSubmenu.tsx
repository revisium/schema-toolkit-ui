import { Box, Input, Menu, Portal } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import React, { FC, useState } from 'react';
import { PiEquals, PiCaretRight } from 'react-icons/pi';
import type { NodeAccessor } from '../../../model/accessor';
import { parseDefaultValue } from './parseDefaultValue';

interface DefaultValueSubmenuProps {
  accessor: NodeAccessor;
  dataTestId: string;
}

export const DefaultValueSubmenu: FC<DefaultValueSubmenuProps> = observer(
  ({ accessor, dataTestId }) => {
    const [localValue, setLocalValue] = useState(accessor.defaultValueAsString);

    const handleBlur = () => {
      accessor.actions.setDefaultValue(parseDefaultValue(localValue, accessor));
    };

    const handleBooleanChange = (checked: boolean) => {
      accessor.actions.setDefaultValue(checked);
    };

    const stopPropagation = (e: React.KeyboardEvent | React.SyntheticEvent) => {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
    };

    const isBoolean = accessor.label.nodeType === 'boolean';
    const isNumber = accessor.label.nodeType === 'number';

    return (
      <Menu.Root positioning={{ placement: 'right-start', gutter: 2 }}>
        <Menu.TriggerItem data-testid={`${dataTestId}-default-menu`}>
          <PiEquals />
          <Box flex="1">Default value</Box>
          {accessor.defaultValueAsString && (
            <Box
              color="gray.400"
              fontSize="xs"
              maxW="80px"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {accessor.defaultValueAsString}
            </Box>
          )}
          <PiCaretRight />
        </Menu.TriggerItem>
        <Portal>
          <Menu.Positioner>
            <Menu.Content p="2" minW="200px">
              {isBoolean ? (
                <Menu.CheckboxItem
                  value="default-true"
                  checked={accessor.defaultValue === true}
                  onCheckedChange={() =>
                    handleBooleanChange(accessor.defaultValue !== true)
                  }
                  data-testid={`${dataTestId}-default-checkbox`}
                >
                  true
                  <Menu.ItemIndicator />
                </Menu.CheckboxItem>
              ) : (
                <Input
                  size="sm"
                  type={isNumber ? 'number' : 'text'}
                  placeholder={isNumber ? '0' : 'default value'}
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
