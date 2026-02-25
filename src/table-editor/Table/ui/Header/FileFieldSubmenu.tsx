import { Box, Menu, Portal, Text } from '@chakra-ui/react';
import { LuChevronRight } from 'react-icons/lu';
import type { FileFieldGroup } from '../../../Columns/model/groupFileFields.js';
import { getFieldTypeIcon } from './getFieldTypeIcon.js';
import { FieldMenuItem } from './FieldMenuItem.js';

interface FileFieldSubmenuProps {
  group: FileFieldGroup;
  parentVisible?: boolean;
  valuePrefix?: string;
  onClick: (field: string) => void;
}

export const FileFieldSubmenu = ({
  group,
  parentVisible,
  valuePrefix,
  onClick,
}: FileFieldSubmenuProps) => {
  if (group.children.length === 0 && !parentVisible) {
    return (
      <FieldMenuItem
        field={group.parent.field}
        name={group.parent.label}
        fieldType={group.parent.fieldType}
        valuePrefix={valuePrefix}
        onClick={onClick}
      />
    );
  }

  return (
    <Menu.Root
      positioning={{ placement: 'right-start', gutter: 2 }}
      lazyMount
      unmountOnExit
    >
      <Menu.TriggerItem data-testid={`file-group-${group.parent.field}`}>
        <Box display="flex" alignItems="center" gap={2} flex={1}>
          <Box
            as="span"
            fontSize="xs"
            fontWeight="medium"
            color="gray.400"
            fontFamily="mono"
            minWidth="20px"
          >
            {getFieldTypeIcon(group.parent.fieldType)}
          </Box>
          <Text truncate>{group.parent.label}</Text>
        </Box>
        <LuChevronRight />
      </Menu.TriggerItem>
      <Portal>
        <Menu.Positioner>
          <Menu.Content maxH="300px" minW="200px" overflowY="auto">
            {!parentVisible && (
              <>
                <FieldMenuItem
                  field={group.parent.field}
                  name={group.parent.label}
                  fieldType={group.parent.fieldType}
                  valuePrefix={valuePrefix}
                  onClick={onClick}
                />
                <Menu.Separator />
              </>
            )}
            {group.children.map((col) => (
              <FieldMenuItem
                key={col.field}
                field={col.field}
                name={col.label}
                fieldType={col.fieldType}
                valuePrefix={valuePrefix}
                onClick={onClick}
              />
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
