import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { RowCountModel } from '../../model/RowCountModel.js';
import { RowCountWidget } from '../RowCountWidget.js';

interface RowCountWrapperProps {
  totalCount: number;
  baseTotalCount: number;
  isFiltering?: boolean;
  isRefetching?: boolean;
}

const RowCountWrapper = observer(
  ({
    totalCount,
    baseTotalCount,
    isFiltering = false,
    isRefetching = false,
  }: RowCountWrapperProps) => {
    const [model] = useState(() => {
      const m = new RowCountModel();
      m.setTotalCount(totalCount);
      m.setBaseTotalCount(baseTotalCount);
      m.setIsFiltering(isFiltering);
      m.setRefetching(isRefetching);
      return m;
    });

    return <RowCountWidget model={model} />;
  },
);

const meta: Meta<typeof RowCountWrapper> = {
  component: RowCountWrapper as any,
  title: 'TableEditor/Status/RowCount',
  decorators: [
    (Story) => (
      <Box p={4} maxW="500px">
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof RowCountWrapper>;

export const Default: Story = {
  render: () => <RowCountWrapper totalCount={42} baseTotalCount={42} />,
};

export const Filtered: Story = {
  render: () => (
    <RowCountWrapper totalCount={12} baseTotalCount={42} isFiltering={true} />
  ),
};

export const Singular: Story = {
  render: () => <RowCountWrapper totalCount={1} baseTotalCount={1} />,
};

export const Refetching: Story = {
  render: () => (
    <RowCountWrapper totalCount={42} baseTotalCount={42} isRefetching={true} />
  ),
};
