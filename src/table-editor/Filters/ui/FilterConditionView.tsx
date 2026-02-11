import { observer } from 'mobx-react-lite';
import { HStack, IconButton } from '@chakra-ui/react';
import { PiXBold } from 'react-icons/pi';
import type { FilterModel } from '../model/FilterModel.js';
import type { FilterCondition } from '../model/types.js';
import type { ColumnSpec } from '../../Columns/model/types.js';
import { operatorRequiresValue } from '../model/operators.js';
import { FieldSelect } from './FieldSelect.js';
import { OperatorSelect } from './OperatorSelect.js';
import { FilterValueInput } from './FilterValueInput.js';

interface FilterConditionViewProps {
  model: FilterModel;
  condition: FilterCondition;
  availableFields: ColumnSpec[];
}

export const FilterConditionView = observer(
  ({ model, condition, availableFields }: FilterConditionViewProps) => {
    return (
      <HStack gap={2} data-testid="filter-condition">
        <FieldSelect
          value={condition.field}
          fields={availableFields}
          onChange={(field) => model.updateCondition(condition.id, { field })}
        />
        <OperatorSelect
          value={condition.operator}
          fieldType={condition.fieldType}
          onChange={(operator) =>
            model.updateCondition(condition.id, { operator })
          }
        />
        {operatorRequiresValue(condition.operator) && (
          <FilterValueInput
            value={condition.value}
            onChange={(value) => model.updateCondition(condition.id, { value })}
            error={model.getConditionError(condition.id)}
          />
        )}
        <IconButton
          aria-label="Remove condition"
          variant="ghost"
          size="2xs"
          onClick={() => model.removeCondition(condition.id)}
          data-testid="remove-condition"
        >
          <PiXBold />
        </IconButton>
      </HStack>
    );
  },
);
