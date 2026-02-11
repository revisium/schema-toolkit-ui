import { observer } from 'mobx-react-lite';
import { Button, Menu, Text } from '@chakra-ui/react';
import { PiCaretDownBold } from 'react-icons/pi';
import type { FilterOperator } from '../model/operators.js';
import { getOperatorInfo, getOperatorsForType } from '../model/operators.js';
import type { FilterFieldType } from '../../shared/field-types.js';

interface OperatorSelectProps {
  value: FilterOperator;
  fieldType: FilterFieldType;
  onChange: (operator: FilterOperator) => void;
}

export const OperatorSelect = observer(
  ({ value, fieldType, onChange }: OperatorSelectProps) => {
    const operators = getOperatorsForType(fieldType);
    const currentLabel = getOperatorInfo(value).label;

    return (
      <Menu.Root>
        <Menu.Trigger asChild>
          <Button
            variant="outline"
            size="sm"
            minW="100px"
            data-testid="operator-select"
          >
            <Text truncate>{currentLabel}</Text>
            <PiCaretDownBold />
          </Button>
        </Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            {operators.map((op) => (
              <Menu.Item
                key={op.operator}
                value={op.operator}
                onClick={() => onChange(op.operator)}
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
