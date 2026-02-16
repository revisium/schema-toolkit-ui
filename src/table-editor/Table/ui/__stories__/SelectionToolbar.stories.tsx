import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import { SelectionModel } from '../../model/SelectionModel.js';
import { SelectionToolbar } from '../SelectionToolbar.js';

ensureReactivityProvider();

const mockDelete = fn();
const allRowIds = ['row-1', 'row-2', 'row-3', 'row-4', 'row-5'];

interface WrapperProps {
  selectedIds: string[];
  withDelete?: boolean;
}

const Wrapper = observer(({ selectedIds, withDelete = true }: WrapperProps) => {
  const [selection] = useState(() => {
    const model = new SelectionModel();
    for (const id of selectedIds) {
      model.toggle(id);
    }
    return model;
  });

  return (
    <Box width="400px" borderWidth="1px" borderColor="gray.200">
      <SelectionToolbar
        selection={selection}
        allRowIds={allRowIds}
        onDelete={withDelete ? mockDelete : undefined}
      />
    </Box>
  );
});

const meta: Meta<typeof Wrapper> = {
  component: Wrapper as any,
  title: 'TableEditor/SelectionToolbar',
};
export default meta;
type Story = StoryObj<typeof Wrapper>;

export const SingleSelected: Story = {
  args: { selectedIds: ['row-1'] },
};

export const MultipleSelected: Story = {
  args: { selectedIds: ['row-1', 'row-2', 'row-3'] },
};

export const WithoutDelete: Story = {
  args: { selectedIds: ['row-1', 'row-2'], withDelete: false },
};
