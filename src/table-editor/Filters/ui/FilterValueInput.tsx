import { observer } from 'mobx-react-lite';
import { Input } from '@chakra-ui/react';

interface FilterValueInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}

export const FilterValueInput = observer(
  ({ value, onChange, error }: FilterValueInputProps) => {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Value"
        size="sm"
        flex={1}
        minW="100px"
        borderColor={error ? 'red.500' : undefined}
        data-testid="filter-value-input"
      />
    );
  },
);
