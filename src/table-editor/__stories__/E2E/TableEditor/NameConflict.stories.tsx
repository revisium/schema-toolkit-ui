import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import {
  createTableEditorStoryState,
  type TableEditorStoryState,
} from '../../helpers.js';
import { StoryWrapper } from '../../../TableEditor/__stories__/TableEditor.stories.js';
import {
  NAME_CONFLICT_SCHEMA,
  NAME_CONFLICT_ROWS_DATA,
} from '../../../TableEditor/__stories__/tableEditorTestData.js';

ensureReactivityProvider();

const noop = () => {};

function createState(): TableEditorStoryState {
  return createTableEditorStoryState({
    dataSchema: NAME_CONFLICT_SCHEMA,
    rowsData: NAME_CONFLICT_ROWS_DATA,
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
  title: 'TableEditor/E2E/TableEditor/NameConflict',
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

export const SystemAndUserFieldsCoexist: Story = {
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

    const sortableFields = state.core.sorts.availableFields;

    // 1. System 'id' field exists in sortable fields
    const sysId = sortableFields.find((c) => c.field === 'id' && c.isSystem);
    expect(sysId).toBeDefined();

    // 2. User 'id' field exists under data namespace
    const userId = sortableFields.find(
      (c) => c.field === 'data.id' && !c.isSystem,
    );
    expect(userId).toBeDefined();
    expect(userId?.label).toBe('id');

    // 3. System 'createdAt' field exists
    const sysCreatedAt = sortableFields.find(
      (c) => c.field === 'createdAt' && c.isSystem,
    );
    expect(sysCreatedAt).toBeDefined();

    // 4. User 'createdAt' field exists under data namespace
    const userCreatedAt = sortableFields.find(
      (c) => c.field === 'data.createdAt' && !c.isSystem,
    );
    expect(userCreatedAt).toBeDefined();
    expect(userCreatedAt?.label).toBe('createdAt');

    // 5. User 'title' and 'score' fields exist
    const titleCol = sortableFields.find((c) => c.field === 'data.title');
    const scoreCol = sortableFields.find((c) => c.field === 'data.score');
    expect(titleCol).toBeDefined();
    expect(scoreCol).toBeDefined();

    // 6. Show user 'id' column and verify both system and user id render
    state.core.columns.showColumn('data.id');

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-id')).toBeVisible();
      expect(canvas.getByTestId('cell-row-1-data.id')).toBeVisible();
    });

    // System id shows rowId
    expect(canvas.getByTestId('cell-row-1-id')).toHaveTextContent('row-1');

    // User id shows user data
    expect(canvas.getByTestId('cell-row-1-data.id')).toHaveTextContent(
      'user-id-1',
    );

    // 7. Add sort on data.id and verify it serializes correctly
    state.core.sorts.addSort('data.id', 'asc');
    const viewState = state.core.getViewState();
    expect(viewState.sorts).toEqual([{ field: 'data.id', direction: 'asc' }]);
  },
};
