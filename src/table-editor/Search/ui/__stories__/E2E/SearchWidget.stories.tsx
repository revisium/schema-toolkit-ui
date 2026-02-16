import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import { SearchModel } from '../../../model/index.js';
import { SearchWidget } from '../../SearchWidget.js';

const E2EWrapper = observer(
  ({ initialQuery = '' }: { initialQuery?: string }) => {
    const [model] = useState(() => {
      const m = new SearchModel(() => {});
      if (initialQuery) {
        m.setQuery(initialQuery);
      }
      return m;
    });

    useEffect(() => {
      (window as any).__testModel = model;
    }, [model]);

    return <SearchWidget model={model} />;
  },
);

const meta: Meta<typeof E2EWrapper> = {
  component: E2EWrapper as any,
  title: 'TableEditor/Search/E2E/SearchWidget',
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof E2EWrapper>;

export const TypeAndSearch: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId('search-input');

    await userEvent.type(input, 'hello');

    expect(input).toHaveValue('hello');
  },
};

export const ClearSearch: Story = {
  tags: ['test'],
  args: {
    initialQuery: 'some text',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId('search-input');

    expect(input).toHaveValue('some text');

    const clearButton = canvas.getByLabelText('Clear');
    await userEvent.click(clearButton);

    expect(input).toHaveValue('');
  },
};

export const DebouncedSearch: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId('search-input');

    await userEvent.type(input, 'debounce test');

    const model = (window as any).__testModel as SearchModel;
    expect(input).toHaveValue('debounce test');

    await waitFor(
      () => {
        expect(model.debouncedQuery).toBe('debounce test');
      },
      { timeout: 1000 },
    );
  },
};
