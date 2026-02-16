import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { SortModel } from '../../model/SortModel.js';
import type { ColumnSpec } from '../../../Columns/model/types.js';
import { FilterFieldType } from '../../../shared/field-types.js';
import { SortingsWidget } from '../SortingsWidget.js';

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

export interface SortStoryWrapperProps {
  setup?: (model: SortModel) => void;
}

export const StoryWrapper = observer(({ setup }: SortStoryWrapperProps) => {
  const [model] = useState(() => {
    const m = new SortModel();
    m.init(TEST_COLUMNS);
    if (setup) {
      setup(m);
    }
    return m;
  });

  return (
    <SortingsWidget
      model={model}
      availableFields={TEST_COLUMNS}
      onApply={() => {}}
    />
  );
});

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/Sort',
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

export const WithOneSort: Story = {
  args: {
    setup: (m: SortModel) => {
      m.addSort('name', 'asc');
    },
  },
};

export const WithMultipleSorts: Story = {
  args: {
    setup: (m: SortModel) => {
      m.addSort('name', 'asc');
      m.addSort('age', 'desc');
    },
  },
};
