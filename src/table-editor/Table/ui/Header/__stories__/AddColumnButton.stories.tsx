import { useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { ensureReactivityProvider } from '../../../../../lib/initReactivity.js';
import type { ColumnSpec } from '../../../../Columns/model/types.js';
import { FilterFieldType } from '../../../../shared/field-types.js';
import { ColumnsModel } from '../../../../Columns/model/ColumnsModel.js';
import { AddColumnButton } from '../AddColumnButton.js';

ensureReactivityProvider();

const ALL_COLUMNS: ColumnSpec[] = [
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
    field: 'data.email',
    label: 'Email',
    fieldType: FilterFieldType.String,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
  },
  {
    field: 'createdAt',
    label: 'createdAt',
    fieldType: FilterFieldType.DateTime,
    isSystem: true,
    isDeprecated: false,
    hasFormula: false,
  },
];

interface WrapperProps {
  visibleCount?: number;
}

const Wrapper = observer(({ visibleCount = 2 }: WrapperProps) => {
  const [columnsModel] = useState(() => {
    const model = new ColumnsModel();
    model.init(ALL_COLUMNS);
    model.reorderColumns(
      ALL_COLUMNS.slice(0, visibleCount).map((c) => c.field),
    );
    return model;
  });

  return (
    <Flex
      height="40px"
      borderBottom="1px solid"
      borderColor="gray.200"
      bg="gray.50"
      alignItems="center"
    >
      <AddColumnButton columnsModel={columnsModel} />
    </Flex>
  );
});

const meta: Meta<typeof Wrapper> = {
  component: Wrapper as any,
  title: 'TableEditor/Header/AddColumnButton',
  decorators: [
    (Story) => (
      <Box p={4} width="200px">
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Wrapper>;

export const WithHiddenColumns: Story = {
  args: { visibleCount: 2 },
};

export const AllColumnsVisible: Story = {
  args: { visibleCount: 5 },
};
