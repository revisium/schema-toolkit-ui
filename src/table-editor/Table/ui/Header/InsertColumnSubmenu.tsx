import { Menu, Portal, Text } from '@chakra-ui/react';
import { LuChevronRight } from 'react-icons/lu';
import type { ColumnSpec } from '../../../Columns/model/types.js';
import { FieldMenuItem } from './FieldMenuItem.js';

interface InsertColumnSubmenuProps {
  label: string;
  valuePrefix: string;
  availableFields: ColumnSpec[];
  onSelect: (field: string) => void;
}

export const InsertColumnSubmenu = ({
  label,
  valuePrefix,
  availableFields,
  onSelect,
}: InsertColumnSubmenuProps) => {
  if (availableFields.length === 0) {
    return null;
  }

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
            {availableFields.map((col) => (
              <FieldMenuItem
                key={col.field}
                field={col.field}
                name={col.label}
                fieldType={col.fieldType}
                valuePrefix={valuePrefix}
                onClick={onSelect}
              />
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
