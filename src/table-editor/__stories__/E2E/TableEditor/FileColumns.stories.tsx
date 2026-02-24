import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent, fn } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import {
  createTableEditorStoryState,
  type TableEditorStoryState,
} from '../../helpers.js';
import { StoryWrapper } from '../../../TableEditor/__stories__/TableEditor.stories.js';
import {
  FILE_TABLE_SCHEMA,
  FILE_MOCK_ROWS_DATA,
  FILE_REF_SCHEMAS,
} from '../../../TableEditor/__stories__/tableEditorTestData.js';
import type { TableEditorCallbacks } from '../../../TableEditor/model/TableEditorCore.js';

ensureReactivityProvider();

const mockUploadFile = fn().mockName('onUploadFile');
const mockOpenFile = fn().mockName('onOpenFile');
const mockOpenRow = fn().mockName('onOpenRow');

const callbacks: TableEditorCallbacks = {
  onOpenRow: mockOpenRow,
  onUploadFile: mockUploadFile,
  onOpenFile: mockOpenFile,
};

function createState(): TableEditorStoryState {
  return createTableEditorStoryState({
    dataSchema: FILE_TABLE_SCHEMA,
    rowsData: FILE_MOCK_ROWS_DATA,
    callbacks,
    refSchemas: FILE_REF_SCHEMAS,
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
  title: 'TableEditor/E2E/TableEditor/FileColumns',
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

export const FileColumnDisplaysFileName: Story = {
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

    const cell = canvas.getByTestId('cell-row-1-data.avatar');
    await waitFor(() => {
      expect(cell).toHaveTextContent('avatar.png');
    });
  },
};

export const FileColumnEditable: Story = {
  tags: ['test'],
  render: () => <Wrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    await waitFor(() => {
      expect(state.core.isBootstrapping).toBe(false);
    });

    const cell = canvas.getByTestId('cell-row-1-data.avatar');
    await userEvent.dblClick(cell);

    const input = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="file-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });

    expect(input.value).toBe('avatar.png');

    await userEvent.clear(input);
    await userEvent.type(input, 'photo.jpg');
    input.blur();

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.avatar')).toHaveTextContent(
        'photo.jpg',
      );
    });
  },
};

export const SubFieldsAvailableViaAddColumn: Story = {
  tags: ['test'],
  render: () => <Wrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    await waitFor(() => {
      expect(state.core.isBootstrapping).toBe(false);
    });

    const visibleBefore = state.core.columns.visibleColumns.length;

    const addButton = canvas.getByTestId('add-column-button');
    await userEvent.click(addButton);

    const statusItem = await waitFor(() => {
      const el = document.querySelector(
        '[data-value="data.avatar.status"]',
      ) as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.click(statusItem);

    await waitFor(() => {
      expect(state.core.columns.visibleColumns.length).toBe(visibleBefore + 1);
      expect(
        state.core.columns.visibleColumns.some(
          (c) => c.field === 'data.avatar.status',
        ),
      ).toBe(true);
    });
  },
};

export const SubFieldsNotVisibleByDefault: Story = {
  tags: ['test'],
  render: () => <Wrapper />,
  play: async () => {
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    await waitFor(() => {
      expect(state.core.isBootstrapping).toBe(false);
    });

    const visibleFields = state.core.columns.visibleColumns.map((c) => c.field);

    expect(visibleFields).not.toContain('data.avatar.status');
    expect(visibleFields).not.toContain('data.avatar.fileId');
    expect(visibleFields).not.toContain('data.avatar.url');
    expect(visibleFields).not.toContain('data.avatar.fileName');

    expect(visibleFields).toContain('data.name');
    expect(visibleFields).toContain('data.avatar');
  },
};
