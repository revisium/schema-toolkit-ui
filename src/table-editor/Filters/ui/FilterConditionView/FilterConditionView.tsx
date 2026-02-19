import { observer } from 'mobx-react-lite';
import { Box, IconButton } from '@chakra-ui/react';
import { LuX } from 'react-icons/lu';
import type { FilterModel } from '../../model/FilterModel.js';
import type { FilterConditionVM } from '../../model/FilterConditionVM.js';
import type { ColumnSpec } from '../../../Columns/model/types.js';
import {
  FilterOperator,
  operatorRequiresValue,
} from '../../model/operators.js';
import { FieldSelect } from '../FieldSelect/FieldSelect.js';
import { OperatorSelect } from '../OperatorSelect/OperatorSelect.js';
import { FilterValueInput } from '../FilterValueInput/FilterValueInput.js';
import { SearchLanguageSelect } from '../SearchLanguageSelect/SearchLanguageSelect.js';
import { SearchTypeSelect } from '../SearchTypeSelect/SearchTypeSelect.js';

interface FilterConditionViewProps {
  model: FilterModel;
  condition: FilterConditionVM;
  availableFields: ColumnSpec[];
}

export const FilterConditionView = observer(
  ({ model, condition, availableFields }: FilterConditionViewProps) => {
    const isSearch = condition.operator === FilterOperator.Search;

    return (
      <Box
        display="flex"
        alignItems="center"
        gap={2}
        minH="40px"
        flexWrap="wrap"
        data-testid="filter-condition"
      >
        <FieldSelect
          value={condition.field}
          fieldType={condition.fieldType}
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
            fieldType={condition.fieldType}
            onChange={(value) => model.updateCondition(condition.id, { value })}
            error={model.getConditionError(condition.id)}
          />
        )}
        {isSearch && (
          <>
            <SearchLanguageSelect
              value={condition.searchLanguage}
              onChange={(searchLanguage) =>
                model.updateCondition(condition.id, { searchLanguage })
              }
            />
            <SearchTypeSelect
              value={condition.searchType}
              onChange={(searchType) =>
                model.updateCondition(condition.id, { searchType })
              }
            />
          </>
        )}
        <IconButton
          aria-label="Remove condition"
          variant="ghost"
          size="sm"
          borderRadius="lg"
          color="gray.400"
          _hover={{ bg: 'gray.100', color: 'gray.600' }}
          onClick={() => model.removeCondition(condition.id)}
          data-testid="remove-condition"
        >
          <LuX size={20} />
        </IconButton>
      </Box>
    );
  },
);
