import { Box } from '@chakra-ui/react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { PlusButton } from '../PlusButton';

const meta: Meta<typeof PlusButton> = {
  component: PlusButton,
  title: 'Components/PlusButton',
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof PlusButton>;

export const Default: Story = {
  args: {
    onClick: fn().mockName('onClick'),
    tooltip: 'New row',
  },
};

export const WithoutTooltip: Story = {
  args: {
    onClick: fn().mockName('onClick'),
  },
};

export const Disabled: Story = {
  args: {
    onClick: fn().mockName('onClick'),
    tooltip: 'New row',
    disabled: true,
  },
};
