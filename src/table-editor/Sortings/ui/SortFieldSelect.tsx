import { observer } from 'mobx-react-lite';
import { Box, Menu, Portal, Text } from '@chakra-ui/react';
import { LuChevronDown } from 'react-icons/lu';
import type { ColumnSpec } from '../../Columns/model/types.js';

interface SortFieldSelectProps {
  currentField: string;
  availableFields: ColumnSpec[];
  usedFields: string[];
  onChange: (field: string) => void;
}

export const SortFieldSelect = observer(
  ({
    currentField,
    availableFields,
    usedFields,
    onChange,
  }: SortFieldSelectProps) => {
    const currentLabel =
      availableFields.find((f) => f.field === currentField)?.label ??
      currentField;

    const selectableFields = availableFields.filter(
      (f) => f.field === currentField || !usedFields.includes(f.field),
    );

    return (
      <Menu.Root>
        <Menu.Trigger asChild>
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            px={2}
            py={1}
            bg="gray.100"
            borderRadius="md"
            cursor="pointer"
            minW="100px"
            _hover={{ bg: 'gray.200' }}
            data-testid="sort-field-select"
          >
            <Text fontSize="sm" truncate maxW="120px">
              {currentLabel}
            </Text>
            <Box ml="auto">
              <LuChevronDown size={14} />
            </Box>
          </Box>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner zIndex="popover">
            <Menu.Content maxH="300px" overflow="auto">
              {selectableFields.map((field) => (
                <Menu.Item
                  key={field.field}
                  value={field.field}
                  onClick={() => onChange(field.field)}
                  bg={field.field === currentField ? 'gray.100' : undefined}
                >
                  {field.label}
                </Menu.Item>
              ))}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    );
  },
);
