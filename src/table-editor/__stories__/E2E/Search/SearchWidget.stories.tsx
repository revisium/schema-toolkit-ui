import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import { SearchModel } from '../../../Search/model/index.js';
import { SearchWidget } from '../../../Search/ui/SearchWidget.js';

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
  title: 'TableEditor/E2E/Search/SearchWidget',
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

export const FullSearchWorkflow: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const trigger = canvas.getByTestId('search-trigger');
    await userEvent.click(trigger);

    const input = await waitFor(() => canvas.getByTestId('search-input'));

    await userEvent.type(input, 'hello');
    expect(input).toHaveValue('hello');

    const model = (window as any).__testModel as SearchModel;

    await waitFor(
      () => {
        expect(model.debouncedQuery).toBe('hello');
      },
      { timeout: 1000 },
    );

    const clearButton = canvas.getByLabelText('Clear');
    await userEvent.click(clearButton);

    expect(model.query).toBe('');

    await waitFor(() => {
      expect(canvas.getByTestId('search-trigger')).toBeVisible();
    });

    await waitFor(
      () => {
        expect(model.debouncedQuery).toBe('');
      },
      { timeout: 1000 },
    );
  },
};

export const ClearCollapsesToMini: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const trigger = canvas.getByTestId('search-trigger');
    await userEvent.click(trigger);

    const input = await waitFor(() => canvas.getByTestId('search-input'));
    await userEvent.type(input, 'hello');
    expect(input).toHaveValue('hello');

    const clearButton = canvas.getByLabelText('Clear');
    await userEvent.click(clearButton);

    await waitFor(() => {
      expect(canvas.getByTestId('search-trigger')).toBeVisible();
    });
    expect(canvas.queryByTestId('search-input')).toBeNull();
  },
};
