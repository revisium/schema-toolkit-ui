import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { FilterModel, FilterOperator } from '../../model/index.js';
import type { ColumnSpec } from '../../../Columns/model/types.js';
import { FilterFieldType } from '../../../shared/field-types.js';
import { FilterWidget } from '../FilterWidget.js';

export const TEST_COLUMNS: ColumnSpec[] = [
  {
    field: 'data.name',
    label: 'Name',
    fieldType: FilterFieldType.String,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
  },
  {
    field: 'data.age',
    label: 'Age',
    fieldType: FilterFieldType.Number,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
  },
  {
    field: 'data.active',
    label: 'Active',
    fieldType: FilterFieldType.Boolean,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
  },
  {
    field: 'createdAt',
    label: 'Created At',
    fieldType: FilterFieldType.DateTime,
    isSystem: true,
    isDeprecated: false,
    hasFormula: false,
  },
  {
    field: 'updatedAt',
    label: 'Updated At',
    fieldType: FilterFieldType.DateTime,
    isSystem: true,
    isDeprecated: false,
    hasFormula: false,
  },
  {
    field: 'data.address.city.name',
    label: 'address.city.name',
    fieldType: FilterFieldType.String,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
  },
  {
    field: 'data.metadata.nested.sub.value',
    label: 'metadata.nested.sub.value',
    fieldType: FilterFieldType.String,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
  },
  {
    field: 'data.stats.monthly.revenue',
    label: 'stats.monthly.revenue',
    fieldType: FilterFieldType.Number,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
  },
];

export interface FilterStoryWrapperProps {
  setup?: (model: FilterModel) => void;
  onApply?: (where: Record<string, unknown> | null) => void;
}

export const StoryWrapper = observer(
  ({ setup, onApply }: FilterStoryWrapperProps) => {
    const [model] = useState(() => {
      const m = new FilterModel();
      m.init(TEST_COLUMNS);
      if (onApply) {
        m.setOnApply(onApply);
      }
      if (setup) {
        setup(m);
      }
      return m;
    });

    return <FilterWidget model={model} availableFields={TEST_COLUMNS} />;
  },
);

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/Filter',
  excludeStories: ['TEST_COLUMNS', 'StoryWrapper'],
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const Empty: Story = {
  args: {
    onApply: fn().mockName('onApply'),
  },
};

export const WithCondition: Story = {
  args: {
    onApply: fn().mockName('onApply'),
    setup: (m: FilterModel) => {
      m.addCondition();
    },
  },
};

export const WithMultipleConditions: Story = {
  args: {
    onApply: fn().mockName('onApply'),
    setup: (m: FilterModel) => {
      m.addCondition();
      m.addCondition();
      m.addCondition();
    },
  },
};

export const WithNestedGroup: Story = {
  args: {
    onApply: fn().mockName('onApply'),
    setup: (m: FilterModel) => {
      m.addCondition();
      m.addGroup();
      const nestedGroup = m.rootGroup.groups[0];
      if (nestedGroup) {
        m.addCondition(nestedGroup.id);
      }
    },
  },
};

export const WithDateTimeCondition: Story = {
  args: {
    onApply: fn().mockName('onApply'),
    setup: (m: FilterModel) => {
      m.addConditionForField('createdAt');
    },
  },
};

export const WithNestedFieldPath: Story = {
  args: {
    onApply: fn().mockName('onApply'),
    setup: (m: FilterModel) => {
      m.addConditionForField('data.metadata.nested.sub.value');
      m.addConditionForField('data.stats.monthly.revenue');
      m.addConditionForField('data.address.city.name');
    },
  },
};

export const WithSearchCondition: Story = {
  args: {
    onApply: fn().mockName('onApply'),
    setup: (m: FilterModel) => {
      m.addCondition();
      const id = m.rootGroup.conditions[0]?.id;
      if (id) {
        m.updateCondition(id, { operator: FilterOperator.Search });
      }
    },
  },
};
