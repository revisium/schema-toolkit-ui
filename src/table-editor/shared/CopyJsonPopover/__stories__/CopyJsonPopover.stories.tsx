import { Box } from '@chakra-ui/react';
import type { Meta, StoryObj } from '@storybook/react';
import { CopyJsonPopover } from '../CopyJsonPopover.js';

const meta: Meta<typeof CopyJsonPopover> = {
  component: CopyJsonPopover,
  title: 'TableEditor/CopyJsonPopover',
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof CopyJsonPopover>;

export const Default: Story = {
  args: {
    data: {
      filters: [
        { field: 'data.name', operator: 'equals', value: 'Alice' },
        { field: 'data.age', operator: 'gt', value: 25 },
      ],
      logic: 'and',
    },
    tooltipContent: 'Copy filter JSON',
    testId: 'copy-json',
  },
};

export const SimpleArray: Story = {
  args: {
    data: [
      { field: 'data.name', direction: 'asc' },
      { field: 'data.age', direction: 'desc' },
    ],
    tooltipContent: 'Copy sort JSON',
    testId: 'copy-json',
  },
};
