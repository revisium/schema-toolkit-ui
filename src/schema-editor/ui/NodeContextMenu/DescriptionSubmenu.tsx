import { Box, Menu, Portal, Textarea } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import React, { FC, useState } from 'react';
import { PiTextT, PiCaretRight } from 'react-icons/pi';
import type { BaseNodeVM } from '../../vm/BaseNodeVM';

interface DescriptionSubmenuProps {
  viewModel: BaseNodeVM;
  dataTestId: string;
}

export const DescriptionSubmenu: FC<DescriptionSubmenuProps> = observer(
  ({ viewModel, dataTestId }) => {
    const [localValue, setLocalValue] = useState(viewModel.description);

    const handleBlur = () => {
      viewModel.setDescription(localValue);
    };

    const stopPropagation = (e: React.KeyboardEvent | React.SyntheticEvent) => {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
    };

    return (
      <Menu.Root positioning={{ placement: 'right-start', gutter: 2 }}>
        <Menu.TriggerItem>
          <PiTextT />
          <Box flex="1">Description</Box>
          {viewModel.hasDescription && (
            <Box
              color="gray.400"
              fontSize="xs"
              maxW="80px"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {viewModel.description}
            </Box>
          )}
          <PiCaretRight />
        </Menu.TriggerItem>
        <Portal>
          <Menu.Positioner>
            <Menu.Content p="2" minW="280px">
              <Textarea
                size="sm"
                placeholder="Add description..."
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={stopPropagation}
                onKeyUp={stopPropagation}
                rows={3}
                autoFocus
                data-testid={`${dataTestId}-description-input`}
              />
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    );
  },
);
