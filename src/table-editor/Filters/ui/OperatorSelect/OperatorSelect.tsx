import { observer } from 'mobx-react-lite';
import { Box, Menu, Text } from '@chakra-ui/react';
import { PiCaretDownLight } from 'react-icons/pi';
import type { FilterOperator } from '../../model/operators.js';
import {
  getOperatorLabel,
  getOperatorsForType,
} from '../../model/operators.js';
import type { FilterFieldType } from '../../../shared/field-types.js';

interface OperatorSelectProps {
  value: FilterOperator;
  fieldType: FilterFieldType;
  onChange: (operator: FilterOperator) => void;
}

export const OperatorSelect = observer(
  ({ value, fieldType, onChange }: OperatorSelectProps) => {
    const operators = getOperatorsForType(fieldType);
    const currentLabel = getOperatorLabel(value, fieldType);

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
            minW="80px"
            _hover={{ bg: 'gray.200' }}
            data-testid="operator-select"
          >
            <Text fontSize="md" fontWeight="medium" truncate>
              {currentLabel}
            </Text>
            <Box color="gray.400" ml="auto">
              <PiCaretDownLight size={14} />
            </Box>
          </Box>
        </Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content minW="120px">
            {operators.map((op) => (
              <Menu.Item
                key={op.operator}
                value={op.operator}
                onClick={() => onChange(op.operator)}
                bg={op.operator === value ? 'gray.100' : undefined}
              >
                {op.label}
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>
    );
  },
);
