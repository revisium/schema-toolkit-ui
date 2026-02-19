import { Box, Menu, Text } from '@chakra-ui/react';
import type { ColumnSpec } from '../../../Columns/model/types.js';
import { getFieldTypeIcon } from '../../../Table/ui/Header/getFieldTypeIcon.js';

interface FieldMenuItemsProps {
  items: ColumnSpec[];
  selectedField: string;
  onChange: (field: string) => void;
}

export const FieldMenuItems = ({
  items,
  selectedField,
  onChange,
}: FieldMenuItemsProps) => (
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
