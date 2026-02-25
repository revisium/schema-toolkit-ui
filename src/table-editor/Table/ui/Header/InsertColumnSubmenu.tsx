import { Menu, Portal, Text } from '@chakra-ui/react';
import { LuChevronRight } from 'react-icons/lu';
import type { ColumnSpec } from '../../../Columns/model/types.js';
import {
  groupFileFields,
  isFileFieldGroup,
} from '../../../Columns/model/groupFileFields.js';
import { FieldMenuItem } from './FieldMenuItem.js';
import { FileFieldSubmenu } from './FileFieldSubmenu.js';

interface InsertColumnSubmenuProps {
  label: string;
  valuePrefix: string;
  availableFields: ColumnSpec[];
  allColumns?: ColumnSpec[];
  onSelect: (field: string) => void;
}

export const InsertColumnSubmenu = ({
  label,
  valuePrefix,
  availableFields,
  allColumns,
  onSelect,
}: InsertColumnSubmenuProps) => {
  if (availableFields.length === 0) {
    return null;
  }

  const groupedFields = groupFileFields(availableFields, allColumns);

  return (
    <Menu.Root
      positioning={{ placement: 'right-start', gutter: 2 }}
      lazyMount
      unmountOnExit
    >
      <Menu.TriggerItem>
        <Text flex={1}>{label}</Text>
        <LuChevronRight />
      </Menu.TriggerItem>
      <Portal>
        <Menu.Positioner>
          <Menu.Content maxH="300px" minW="200px" overflowY="auto">
            {groupedFields.map((item) =>
              isFileFieldGroup(item) ? (
                <FileFieldSubmenu
                  key={item.parent.field}
                  group={item}
                  parentVisible={item.parentVisible}
                  valuePrefix={valuePrefix}
                  onClick={onSelect}
                />
              ) : (
                <FieldMenuItem
                  key={item.field}
                  field={item.field}
                  name={item.label}
                  fieldType={item.fieldType}
                  valuePrefix={valuePrefix}
                  onClick={onSelect}
                />
              ),
            )}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
