import { useState } from 'react';
import { Box, Button } from '@chakra-ui/react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog.js';

const mockConfirm = fn();

const Wrapper = ({ count }: { count?: number }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Box p={4}>
      <Button size="sm" onClick={() => setIsOpen(true)}>
        Open dialog
      </Button>
      <DeleteConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => {
          mockConfirm();
          setIsOpen(false);
        }}
        count={count}
      />
    </Box>
  );
};

const meta: Meta<typeof Wrapper> = {
  component: Wrapper as any,
  title: 'TableEditor/DeleteConfirmDialog',
};
export default meta;
type Story = StoryObj<typeof Wrapper>;

export const SingleRow: Story = {};

export const BatchDelete: Story = {
  args: { count: 5 },
};
