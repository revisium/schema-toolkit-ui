import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { FilterModel } from '../../model/index.js';
import type { ColumnSpec } from '../../../Columns/model/types.js';
import { FilterFieldType } from '../../../shared/field-types.js';
import { FilterWidget } from '../FilterWidget.js';

export const TEST_COLUMNS: ColumnSpec[] = [
  {
    field: 'name',
    label: 'Name',
    fieldType: FilterFieldType.String,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
  },
  {
    field: 'age',
    label: 'Age',
    fieldType: FilterFieldType.Number,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
  },
  {
    field: 'active',
    label: 'Active',
    fieldType: FilterFieldType.Boolean,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
  },
];

export interface FilterStoryWrapperProps {
  setup?: (model: FilterModel) => void;
}

export const StoryWrapper = observer(({ setup }: FilterStoryWrapperProps) => {
  const [model] = useState(() => {
    const m = new FilterModel();
    m.init(TEST_COLUMNS);
    if (setup) {
      setup(m);
    }
    return m;
  });

  return (
    <FilterWidget
      model={model}
      availableFields={TEST_COLUMNS}
      onApply={() => {}}
    />
  );
});

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/Filter',
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

export const Empty: Story = {};

export const WithCondition: Story = {
  args: {
    setup: (m: FilterModel) => {
      m.addCondition();
    },
  },
};

export const WithMultipleConditions: Story = {
  args: {
    setup: (m: FilterModel) => {
      m.addCondition();
      m.addCondition();
      m.addCondition();
    },
  },
};

export const WithNestedGroup: Story = {
  args: {
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
