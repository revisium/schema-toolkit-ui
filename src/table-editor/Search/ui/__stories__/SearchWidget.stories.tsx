import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { SearchModel } from '../../model/index.js';
import { SearchWidget } from '../SearchWidget.js';

const StoryWrapper = observer(
  ({ initialQuery = '' }: { initialQuery?: string }) => {
    const [model] = useState(() => {
      const m = new SearchModel(() => {});
      if (initialQuery) {
        m.setQuery(initialQuery);
      }
      return m;
    });

    return <SearchWidget model={model} />;
  },
);

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/Search',
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

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    initialQuery: 'test query',
  },
};
