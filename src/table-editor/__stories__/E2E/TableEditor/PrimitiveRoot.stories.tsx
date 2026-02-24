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
  PRIMITIVE_STRING_SCHEMA,
  PRIMITIVE_STRING_ROWS_DATA,
} from '../../../TableEditor/__stories__/tableEditorTestData.js';

ensureReactivityProvider();

const noop = () => {};

function createState(): TableEditorStoryState {
  return createTableEditorStoryState({
    dataSchema: PRIMITIVE_STRING_SCHEMA,
    rowsData: PRIMITIVE_STRING_ROWS_DATA,
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
  title: 'TableEditor/E2E/TableEditor/PrimitiveRoot',
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

export const PrimitiveStringRendersAndEdits: Story = {
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

    // 1. Verify data column is 'data' (primitive root)
    const dataColumns = state.core.columns.visibleColumns.filter(
      (c) => !c.isSystem,
    );
    expect(dataColumns).toHaveLength(1);
    expect(dataColumns[0]?.field).toBe('data');
    expect(dataColumns[0]?.label).toBe('data');

    // 2. Verify system fields are present in sortable fields
    const sortableFields = state.core.sorts.availableFields;
    const sysFields = sortableFields.filter((f) => f.isSystem);
    expect(sysFields.length).toBeGreaterThan(0);
    expect(sysFields.map((f) => f.field)).toContain('id');

    // 3. Verify rows render with primitive values
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data')).toBeVisible();
    });
    expect(canvas.getByTestId('cell-row-1-data')).toHaveTextContent(
      'Hello world',
    );
    expect(canvas.getByTestId('cell-row-2-data')).toHaveTextContent(
      'Bonjour le monde',
    );

    // 4. Verify cell is editable
    const cell = canvas.getByTestId('cell-row-1-data');
    await userEvent.dblClick(cell);
    const input = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.clear(input);
    await userEvent.type(input, 'Edited');
    input.blur();
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data')).toHaveTextContent('Edited');
    });
  },
};

export const PrimitiveStringSort: Story = {
  tags: ['test'],
  play: async () => {
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    await waitFor(() => {
      expect(state.core.isBootstrapping).toBe(false);
    });

    // Verify sort model includes the 'data' field
    const sortableFields = state.core.sorts.availableFields;
    const dataField = sortableFields.find((f) => f.field === 'data');
    expect(dataField).toBeDefined();

    // Add sort on 'data' field and apply
    state.core.sorts.addSort('data', 'asc');
    state.core.sorts.apply();

    // Verify view state serializes correctly
    const viewState = state.core.getViewState();
    expect(viewState.sorts).toEqual([{ field: 'data', direction: 'asc' }]);
  },
};
