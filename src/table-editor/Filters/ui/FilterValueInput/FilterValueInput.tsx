import { observer } from 'mobx-react-lite';
import { Input } from '@chakra-ui/react';
import { FilterFieldType } from '../../../shared/field-types.js';

interface FilterValueInputProps {
  value: string;
  fieldType: FilterFieldType;
  onChange: (value: string) => void;
  error?: string | null;
}

function toDateTimeLocalValue(isoString: string): string {
  if (!isoString) {
    return '';
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function fromDateTimeLocalValue(localValue: string): string {
  if (!localValue) {
    return '';
  }
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString();
}

export const FilterValueInput = observer(
  ({ value, fieldType, onChange, error }: FilterValueInputProps) => {
    if (fieldType === FilterFieldType.DateTime) {
      return (
        <Input
          type="datetime-local"
          value={toDateTimeLocalValue(value)}
          onChange={(e) => onChange(fromDateTimeLocalValue(e.target.value))}
          size="sm"
          w="160px"
          h="40px"
          borderRadius="lg"
          borderColor={error ? 'red.500' : 'gray.200'}
          data-testid="filter-value-input"
        />
      );
    }

    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="value"
        size="sm"
        w="160px"
        h="40px"
        borderRadius="lg"
        borderColor={error ? 'red.500' : 'gray.200'}
        data-testid="filter-value-input"
      />
    );
  },
);
