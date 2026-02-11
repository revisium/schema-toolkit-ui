import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor } from 'storybook/test';
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

    useEffect(() => {
      (window as any).__testModel = model;
    }, [model]);

    return <RowCountWidget model={model} />;
  },
);

const meta: Meta<typeof RowCountWrapper> = {
  component: RowCountWrapper as any,
  title: 'TableEditor/RowCountWidget',
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

export const TextCheck: Story = {
  tags: ['test'],
  render: () => (
    <RowCountWrapper totalCount={5} baseTotalCount={20} isFiltering={true} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      const text = canvas.getByTestId('row-count-text');
      expect(text.textContent).toBe('5 of 20 rows');
    });
  },
};
