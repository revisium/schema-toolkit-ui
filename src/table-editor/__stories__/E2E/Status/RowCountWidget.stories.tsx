import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor } from 'storybook/test';
import { RowCountModel } from '../../../Status/model/RowCountModel.js';
import { RowCountWidget } from '../../../Status/ui/RowCountWidget.js';

const RowCountWrapper = observer(
  ({
    totalCount,
    baseTotalCount,
    isFiltering = false,
  }: {
    totalCount: number;
    baseTotalCount: number;
    isFiltering?: boolean;
  }) => {
    const [model] = useState(() => {
      const m = new RowCountModel();
      m.setTotalCount(totalCount);
      m.setBaseTotalCount(baseTotalCount);
      m.setIsFiltering(isFiltering);
      return m;
    });

    return <RowCountWidget model={model} />;
  },
);

const meta: Meta<typeof RowCountWrapper> = {
  component: RowCountWrapper as any,
  title: 'TableEditor/E2E/Status/RowCount',
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
