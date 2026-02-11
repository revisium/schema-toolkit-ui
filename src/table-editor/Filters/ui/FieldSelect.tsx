import { observer } from 'mobx-react-lite';
import { Button, Menu, Text } from '@chakra-ui/react';
import { PiCaretDownBold } from 'react-icons/pi';
import type { ColumnSpec } from '../../Columns/model/types.js';

interface FieldSelectProps {
  value: string;
  fields: ColumnSpec[];
  onChange: (field: string) => void;
}

export const FieldSelect = observer(
  ({ value, fields, onChange }: FieldSelectProps) => {
    const currentLabel = fields.find((f) => f.field === value)?.label ?? value;

    return (
      <Menu.Root>
        <Menu.Trigger asChild>
          <Button
            variant="outline"
            size="sm"
            minW="120px"
            data-testid="field-select"
          >
            <Text truncate>{currentLabel}</Text>
            <PiCaretDownBold />
          </Button>
        </Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            {fields.map((f) => (
              <Menu.Item
                key={f.field}
                value={f.field}
                onClick={() => onChange(f.field)}
              >
                {f.label}
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>
    );
  },
);
