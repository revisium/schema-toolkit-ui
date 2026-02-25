import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { SortModel } from '../../model/SortModel.js';
import type { ColumnSpec } from '../../../Columns/model/types.js';
import type { ViewSort } from '../../model/types.js';
import { FilterFieldType } from '../../../shared/field-types.js';
import { SortingsWidget } from '../SortingsWidget.js';
import { SystemFieldId } from '../../../shared/system-fields.js';

export const TEST_COLUMNS: ColumnSpec[] = [
  {
    field: 'data.name',
    label: 'Name',
    fieldType: FilterFieldType.String,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
    isSortable: true,
  },
  {
    field: 'data.age',
    label: 'Age',
    fieldType: FilterFieldType.Number,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
    isSortable: true,
  },
  {
    field: 'data.active',
    label: 'Active',
    fieldType: FilterFieldType.Boolean,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
    isSortable: true,
  },
  {
    field: 'createdAt',
    label: 'createdAt',
    fieldType: FilterFieldType.DateTime,
    isSystem: true,
    systemFieldId: SystemFieldId.CreatedAt,
    isDeprecated: false,
    hasFormula: false,
    isSortable: true,
  },
];

export interface SortStoryWrapperProps {
  setup?: (model: SortModel) => void;
  onChange?: (sorts: ViewSort[]) => void;
}

export const StoryWrapper = observer(
  ({ setup, onChange }: SortStoryWrapperProps) => {
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
        onChange={onChange ?? (() => {})}
      />
    );
  },
);

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/Sort',
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
    onChange: fn().mockName('onChange'),
  },
};

export const WithOneSort: Story = {
  args: {
    onChange: fn().mockName('onChange'),
    setup: (m: SortModel) => {
      m.addSort('data.name', 'asc');
    },
  },
};

export const WithMultipleSorts: Story = {
  args: {
    onChange: fn().mockName('onChange'),
    setup: (m: SortModel) => {
      m.addSort('data.name', 'asc');
      m.addSort('data.age', 'desc');
    },
  },
};
