import { observer } from 'mobx-react-lite';
import { Box, Menu, Text } from '@chakra-ui/react';
import { PiCaretDownLight } from 'react-icons/pi';
import type { ColumnSpec } from '../../Columns/model/types.js';
import type { FilterFieldType } from '../../shared/field-types.js';
import { getFieldTypeIcon } from '../../Table/ui/Header/getFieldTypeIcon.js';

interface FieldSelectProps {
  value: string;
  fieldType: FilterFieldType;
  fields: ColumnSpec[];
  onChange: (field: string) => void;
}

const FieldMenuItems = ({
  items,
  selectedField,
  onChange,
}: {
  items: ColumnSpec[];
  selectedField: string;
  onChange: (field: string) => void;
}) => (
  <>
    {items.map((f) => (
      <Menu.Item
        key={f.field}
        value={f.field}
        onClick={() => onChange(f.field)}
        bg={f.field === selectedField ? 'gray.100' : undefined}
      >
        <Box display="flex" alignItems="center" gap={2} width="100%">
          <Box
            fontSize="sm"
            fontFamily="mono"
            color="gray.400"
            width="24px"
            textAlign="center"
          >
            {getFieldTypeIcon(f.fieldType)}
          </Box>
          <Text truncate>{f.label || '(unnamed)'}</Text>
        </Box>
      </Menu.Item>
    ))}
  </>
);

export const FieldSelect = observer(
  ({ value, fieldType, fields, onChange }: FieldSelectProps) => {
    const currentLabel = fields.find((f) => f.field === value)?.label ?? value;
    const dataFields = fields.filter((f) => !f.isSystem);
    const systemFields = fields.filter((f) => f.isSystem);

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
            data-testid="field-select"
          >
            <Box fontSize="sm" fontFamily="mono" color="gray.400" minW="16px">
              {getFieldTypeIcon(fieldType)}
            </Box>
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
            {dataFields.length > 0 && (
              <Menu.ItemGroup>
                <Menu.ItemGroupLabel
                  fontWeight="medium"
                  color="gray.500"
                  fontSize="xs"
                >
                  Data fields
                </Menu.ItemGroupLabel>
                <FieldMenuItems
                  items={dataFields}
                  selectedField={value}
                  onChange={onChange}
                />
              </Menu.ItemGroup>
            )}
            {systemFields.length > 0 && (
              <>
                {dataFields.length > 0 && <Menu.Separator />}
                <Menu.ItemGroup>
                  <Menu.ItemGroupLabel
                    fontWeight="medium"
                    color="gray.500"
                    fontSize="xs"
                  >
                    System fields
                  </Menu.ItemGroupLabel>
                  <FieldMenuItems
                    items={systemFields}
                    selectedField={value}
                    onChange={onChange}
                  />
                </Menu.ItemGroup>
              </>
            )}
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>
    );
  },
);
