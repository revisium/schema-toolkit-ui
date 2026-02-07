import { Box, Menu, Portal, Textarea } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import React, { FC, useCallback, useState } from 'react';
import { PiTextT, PiCaretRight } from 'react-icons/pi';
import type { NodeAccessor } from '../../../model/accessor';

interface DescriptionSubmenuProps {
  accessor: NodeAccessor;
  dataTestId: string;
}

export const DescriptionSubmenu: FC<DescriptionSubmenuProps> = observer(
  ({ accessor, dataTestId }) => {
    const [localValue, setLocalValue] = useState(
      accessor.label.description ?? '',
    );

    const handleBlur = () => {
      accessor.actions.setDescription(localValue || undefined);
    };

    const stopPropagation = (e: React.KeyboardEvent | React.SyntheticEvent) => {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
    };

    return (
      <Menu.Root positioning={{ placement: 'right-start', gutter: 2 }}>
        <Menu.TriggerItem data-testid={`${dataTestId}-description-menu`}>
          <PiTextT />
          <Box flex="1">Description</Box>
          {accessor.label.description && (
            <Box
              color="gray.400"
              fontSize="xs"
              maxW="80px"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {accessor.label.description}
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
                ref={useCallback((el: HTMLTextAreaElement | null) => {
                  if (el) {
                    requestAnimationFrame(() => {
                      el.focus({ preventScroll: true });
                      const len = el.value.length;
                      el.setSelectionRange(len, len);
                    });
                  }
                }, [])}
                data-testid={`${dataTestId}-description-input`}
              />
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    );
  },
);
