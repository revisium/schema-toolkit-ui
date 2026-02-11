import { Menu, Portal, Text } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import {
  LuArrowDownAZ,
  LuArrowUpAZ,
  LuChevronRight,
  LuX,
} from 'react-icons/lu';
import type { SortModel } from '../../../Sortings/model/SortModel.js';

interface SortSubmenuProps {
  field: string;
  sortModel: SortModel;
}

export const SortSubmenu = observer(
  ({ field, sortModel }: SortSubmenuProps) => {
    const currentDirection = sortModel.getSortDirection(field);
    const isSorted = sortModel.isSorted(field);

    const handleSortAsc = () => {
      sortModel.setSingleSort(field, 'asc');
    };

    const handleSortDesc = () => {
      sortModel.setSingleSort(field, 'desc');
    };

    const handleRemoveSort = () => {
      sortModel.removeSort(field);
    };

    return (
      <Menu.Root
        positioning={{ placement: 'right-start', gutter: 2 }}
        lazyMount
        unmountOnExit
      >
        <Menu.TriggerItem>
          <Text flex={1}>Sort</Text>
          <LuChevronRight />
        </Menu.TriggerItem>
        <Portal>
          <Menu.Positioner>
            <Menu.Content minW="160px">
              <Menu.Item
                value="sort-asc"
                onClick={handleSortAsc}
                color={currentDirection === 'asc' ? 'blue.600' : undefined}
              >
                <LuArrowUpAZ />
                <Text>Sort A → Z</Text>
              </Menu.Item>
              <Menu.Item
                value="sort-desc"
                onClick={handleSortDesc}
                color={currentDirection === 'desc' ? 'blue.600' : undefined}
              >
                <LuArrowDownAZ />
                <Text>Sort Z → A</Text>
              </Menu.Item>
              {isSorted && (
                <>
                  <Menu.Separator />
                  <Menu.Item value="remove-sort" onClick={handleRemoveSort}>
                    <LuX />
                    <Text>Remove sort</Text>
                  </Menu.Item>
                </>
              )}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    );
  },
);
