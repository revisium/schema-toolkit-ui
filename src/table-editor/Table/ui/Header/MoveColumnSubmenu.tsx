import { Menu, Portal, Text } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import {
  LuArrowLeftToLine,
  LuArrowRightToLine,
  LuChevronLeft,
  LuChevronRight,
} from 'react-icons/lu';
import type { ColumnsModel } from '../../../Columns/model/ColumnsModel.js';

interface MoveColumnSubmenuProps {
  field: string;
  columnsModel: ColumnsModel;
}

export const MoveColumnSubmenu = observer(
  ({ field, columnsModel }: MoveColumnSubmenuProps) => {
    const canMoveLeft = columnsModel.canMoveLeft(field);
    const canMoveRight = columnsModel.canMoveRight(field);
    const canMoveToStart = columnsModel.canMoveToStart(field);
    const canMoveToEnd = columnsModel.canMoveToEnd(field);

    if (!canMoveLeft && !canMoveRight) {
      return null;
    }

    return (
      <Menu.Root
        positioning={{ placement: 'right-start', gutter: 2 }}
        lazyMount
        unmountOnExit
      >
        <Menu.TriggerItem>
          <Text flex={1}>Move column</Text>
          <LuChevronRight />
        </Menu.TriggerItem>
        <Portal>
          <Menu.Positioner>
            <Menu.Content minW="160px">
              {canMoveLeft && (
                <Menu.Item
                  value="move-left"
                  onClick={() => columnsModel.moveColumnLeft(field)}
                >
                  <LuChevronLeft />
                  <Text>Move left</Text>
                </Menu.Item>
              )}
              {canMoveToStart && (
                <Menu.Item
                  value="move-to-start"
                  onClick={() => columnsModel.moveColumnToStart(field)}
                >
                  <LuArrowLeftToLine />
                  <Text>Move to start</Text>
                </Menu.Item>
              )}
              {canMoveRight && (
                <Menu.Item
                  value="move-right"
                  onClick={() => columnsModel.moveColumnRight(field)}
                >
                  <LuChevronRight />
                  <Text>Move right</Text>
                </Menu.Item>
              )}
              {canMoveToEnd && (
                <Menu.Item
                  value="move-to-end"
                  onClick={() => columnsModel.moveColumnToEnd(field)}
                >
                  <LuArrowRightToLine />
                  <Text>Move to end</Text>
                </Menu.Item>
              )}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    );
  },
);
