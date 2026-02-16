import { useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { RowActionsMenu } from '../RowActionsMenu.js';

const mockSelect = fn();
const mockDuplicate = fn();
const mockDelete = fn();

const Wrapper = ({
  withSelect = true,
  withDuplicate = true,
  withDelete = true,
}: {
  withSelect?: boolean;
  withDuplicate?: boolean;
  withDelete?: boolean;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Box width="300px" p={4}>
      <Flex
        className="group"
        position="relative"
        height="40px"
        alignItems="center"
        px={3}
        borderWidth="1px"
        borderColor={hovered ? 'blue.200' : 'gray.200'}
        bg={hovered ? 'gray.50' : 'white'}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        Sample row content
        <RowActionsMenu
          rowId="row-1"
          onSelect={withSelect ? mockSelect : undefined}
          onDuplicate={withDuplicate ? mockDuplicate : undefined}
          onDelete={withDelete ? mockDelete : undefined}
        />
      </Flex>
    </Box>
  );
};

const meta: Meta<typeof Wrapper> = {
  component: Wrapper as any,
  title: 'TableEditor/RowActionsMenu',
};
export default meta;
type Story = StoryObj<typeof Wrapper>;

export const AllActions: Story = {
  args: { withSelect: true, withDuplicate: true, withDelete: true },
};

export const SelectAndDeleteOnly: Story = {
  args: { withSelect: true, withDuplicate: false, withDelete: true },
};

export const DeleteOnly: Story = {
  args: { withSelect: false, withDuplicate: false, withDelete: true },
};
