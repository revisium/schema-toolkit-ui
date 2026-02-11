import { Box, Menu, Text } from '@chakra-ui/react';
import { memo } from 'react';
import type { FilterFieldType } from '../../../shared/field-types.js';
import { getFieldTypeIcon } from './getFieldTypeIcon.js';

interface FieldMenuItemProps {
  field: string;
  name: string;
  fieldType: FilterFieldType;
  valuePrefix?: string;
  onClick: (field: string) => void;
}

export const FieldMenuItem = memo(
  ({ field, name, fieldType, valuePrefix, onClick }: FieldMenuItemProps) => {
    const handleClick = () => onClick(field);

    return (
      <Menu.Item
        value={valuePrefix ? `${valuePrefix}-${field}` : field}
        onClick={handleClick}
      >
        <Box display="flex" alignItems="center" gap={2} width="100%">
          <Box
            as="span"
            fontSize="xs"
            fontWeight="medium"
            color="gray.400"
            fontFamily="mono"
            minWidth="20px"
          >
            {getFieldTypeIcon(fieldType)}
          </Box>
          <Text truncate>{name || '(unnamed)'}</Text>
        </Box>
      </Menu.Item>
    );
  },
);
