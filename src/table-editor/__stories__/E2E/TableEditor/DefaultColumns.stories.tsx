import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import {
  createTableEditorStoryState,
  type TableEditorStoryState,
} from '../../helpers.js';
import { StoryWrapper } from '../../../TableEditor/__stories__/TableEditor.stories.js';
import {
  MANY_COLUMNS_SCHEMA,
  MANY_COLUMNS_ROWS,
} from '../../../TableEditor/__stories__/tableEditorTestData.js';

ensureReactivityProvider();

const noop = () => {};

function createState(): TableEditorStoryState {
  return createTableEditorStoryState({
    dataSchema: MANY_COLUMNS_SCHEMA,
    rowsData: MANY_COLUMNS_ROWS,
    callbacks: {
      onOpenRow: noop,
      onDuplicateRow: noop,
    },
  });
}

const Wrapper = observer(() => {
  const [state] = useState(createState);

  useEffect(() => {
    (window as any).__testState = state;
    return () => {
      delete (window as any).__testState;
    };
  }, [state]);

  return <StoryWrapper state={state} />;
});

const meta: Meta<typeof Wrapper> = {
  component: Wrapper as any,
  title: 'TableEditor/E2E/TableEditor/DefaultColumns',
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Wrapper>;

export const DefaultColumnSelection: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    await waitFor(() => {
      expect(state.core.isBootstrapping).toBe(false);
    });

    // 1. Verify selectDefaultColumns picks id + 3 semantic strings = 4 columns
    const visibleFields = state.core.columns.visibleColumns.map((c) => c.field);
    expect(visibleFields).toHaveLength(4);
    expect(visibleFields[0]).toBe('id');
    expect(visibleFields).toContain('name');
    expect(visibleFields).toContain('email');
    expect(visibleFields).toContain('city');

    // 2. Verify non-semantic fields are hidden
    expect(visibleFields).not.toContain('age');
    expect(visibleFields).not.toContain('active');
    expect(visibleFields).not.toContain('score');

    // 3. Verify id column header is rendered in DOM
    await waitFor(() => {
      expect(canvas.getByTestId('header-id')).toBeVisible();
    });

    // 4. Verify id column cells show row ids
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-id')).toBeVisible();
    });
    expect(canvas.getByTestId('cell-row-1-id')).toHaveTextContent('row-1');
    expect(canvas.getByTestId('cell-row-2-id')).toHaveTextContent('row-2');

    // 5. Verify data columns display values
    expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('Alice');
    expect(canvas.getByTestId('cell-row-1-email')).toHaveTextContent(
      'alice@example.com',
    );
    expect(canvas.getByTestId('cell-row-1-city')).toHaveTextContent('New York');

    // 6. Add hidden column via + button and verify expansion works
    const addBtn = canvas.getByTestId('add-column-button');
    await userEvent.click(addBtn);

    const ageItem = await waitFor(() => {
      const el = document.querySelector('[data-value="age"]') as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.click(ageItem);

    await waitFor(() => {
      expect(
        state.core.columns.visibleColumns.some((c) => c.field === 'age'),
      ).toBe(true);
    });

    expect(state.core.columns.visibleColumns).toHaveLength(5);

    // 7. Verify id is still first after adding a column
    expect(state.core.columns.visibleColumns[0]?.field).toBe('id');
  },
};
