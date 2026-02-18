import { observer } from 'mobx-react-lite';
import { Box, Menu, Text } from '@chakra-ui/react';
import { PiCaretDownLight } from 'react-icons/pi';
import type { ColumnSpec } from '../../Columns/model/types.js';
import { getFieldTypeIcon } from '../../Table/ui/Header/getFieldTypeIcon.js';

interface SortFieldSelectProps {
  currentField: string;
  availableFields: ColumnSpec[];
  onChange: (field: string) => void;
}

export const SortFieldSelect = observer(
  ({ currentField, availableFields, onChange }: SortFieldSelectProps) => {
    const currentCol = availableFields.find((f) => f.field === currentField);
    const currentLabel = currentCol?.label ?? currentField;

    return (
      <Menu.Root>
        <Menu.Trigger asChild>
          <Box
            display="flex"
            alignItems="center"
            gap={1.5}
            px={4}
            h="40px"
            bg="gray.100"
            borderRadius="lg"
            cursor="pointer"
            minW="100px"
            _hover={{ bg: 'gray.200' }}
            data-testid="sort-field-select"
          >
            {currentCol && (
              <Box fontSize="sm" fontFamily="mono" color="gray.400" minW="16px">
                {getFieldTypeIcon(currentCol.fieldType)}
              </Box>
            )}
            <Text fontSize="md" fontWeight="medium" truncate maxW="120px">
              {currentLabel}
            </Text>
            <Box ml="auto" color="gray.400">
              <PiCaretDownLight size={14} />
            </Box>
          </Box>
        </Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content maxH="300px" overflow="auto" minW="180px">
            {availableFields.map((field) => (
              <Menu.Item
                key={field.field}
                value={field.field}
                onClick={() => onChange(field.field)}
                bg={field.field === currentField ? 'gray.100' : undefined}
              >
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  <Box
                    fontSize="sm"
                    fontFamily="mono"
                    color="gray.400"
                    width="24px"
                    textAlign="center"
                  >
                    {getFieldTypeIcon(field.fieldType)}
                  </Box>
                  <Text truncate>{field.label || '(unnamed)'}</Text>
                </Box>
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>
    );
  },
);
