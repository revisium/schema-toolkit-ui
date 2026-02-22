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
  TABLE_SCHEMA,
  TEST_COLUMNS,
  MOCK_ROWS_DATA,
} from '../../../TableEditor/__stories__/tableEditorTestData.js';
import type { TableEditorBreadcrumb } from '../../../TableEditor/model/TableEditorCore.js';

ensureReactivityProvider();

const mockOpenRow = fn();
const mockDuplicateRow = fn();
const mockBreadcrumbClick = fn();
const mockCreateRow = fn();

const STORY_BREADCRUMBS: TableEditorBreadcrumb[] = [
  { label: 'Database', dataTestId: 'breadcrumb-0' },
  { label: 'invoices', dataTestId: 'breadcrumb-1' },
];

function createState(): TableEditorStoryState {
  return createTableEditorStoryState({
    schema: TABLE_SCHEMA,
    columns: TEST_COLUMNS,
    rowsData: MOCK_ROWS_DATA,
    breadcrumbs: STORY_BREADCRUMBS,
    callbacks: {
      onOpenRow: mockOpenRow,
      onDuplicateRow: mockDuplicateRow,
      onBreadcrumbClick: mockBreadcrumbClick,
      onCreateRow: mockCreateRow,
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
  title: 'TableEditor/E2E/TableEditor/ExternalCallbacks',
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

export const BreadcrumbClick: Story = {
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

    mockBreadcrumbClick.mockClear();

    const segment = canvas.getByTestId('breadcrumb-0');
    await userEvent.click(segment);

    await waitFor(() => {
      expect(mockBreadcrumbClick).toHaveBeenCalledTimes(1);
    });

    expect(mockBreadcrumbClick).toHaveBeenCalledWith(
      { label: 'Database', dataTestId: 'breadcrumb-0' },
      0,
    );
  },
};

export const CreateRowClick: Story = {
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

    mockCreateRow.mockClear();

    const createBtn = canvas.getByTestId('create-row-button');
    await userEvent.click(createBtn);

    await waitFor(() => {
      expect(mockCreateRow).toHaveBeenCalledTimes(1);
    });
  },
};

export const OpenRowViaButton: Story = {
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

    mockOpenRow.mockClear();

    const row = canvas.getByTestId('row-row-1');
    await userEvent.hover(row);

    const openBtn = await waitFor(() => {
      const el = canvas.getByTestId('row-action-open-row-1');
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.click(openBtn);

    await waitFor(() => {
      expect(mockOpenRow).toHaveBeenCalledWith('row-1');
    });
  },
};

export const OpenRowViaMenu: Story = {
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

    mockOpenRow.mockClear();

    const row = canvas.getByTestId('row-row-2');
    await userEvent.hover(row);

    const trigger = await waitFor(() => {
      const el = canvas.getByTestId('row-action-trigger-row-2');
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.click(trigger);

    const openItem = await waitFor(() => {
      const el = document.querySelector('[data-value="open"]') as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.click(openItem);

    await waitFor(() => {
      expect(mockOpenRow).toHaveBeenCalledWith('row-2');
    });
  },
};

export const DuplicateRowViaMenu: Story = {
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

    mockDuplicateRow.mockClear();

    const row = canvas.getByTestId('row-row-1');
    await userEvent.hover(row);

    const trigger = await waitFor(() => {
      const el = canvas.getByTestId('row-action-trigger-row-1');
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.click(trigger);

    const duplicateItem = await waitFor(() => {
      const el = document.querySelector(
        '[data-value="duplicate"]',
      ) as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.click(duplicateItem);

    await waitFor(() => {
      expect(mockDuplicateRow).toHaveBeenCalledWith('row-1');
    });
  },
};

export const ReadonlyHidesMutationActions: Story = {
  tags: ['test'],
  render: () => {
    const ReadonlyWrapper = observer(() => {
      const [state] = useState(() =>
        createTableEditorStoryState({
          schema: TABLE_SCHEMA,
          columns: TEST_COLUMNS,
          rowsData: MOCK_ROWS_DATA,
          readonly: true,
          callbacks: { onOpenRow: mockOpenRow },
        }),
      );

      useEffect(() => {
        (window as any).__testState = state;
        return () => {
          delete (window as any).__testState;
        };
      }, [state]);

      return <StoryWrapper state={state} />;
    });

    return <ReadonlyWrapper />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    await waitFor(() => {
      expect(state.core.isBootstrapping).toBe(false);
    });

    mockOpenRow.mockClear();

    // Create row button should not be visible in readonly
    expect(canvas.queryByTestId('create-row-button')).toBeNull();

    // Open button still works in readonly (open is not a mutation)
    const row = canvas.getByTestId('row-row-1');
    await userEvent.hover(row);

    const openBtn = await waitFor(() => {
      const el = canvas.getByTestId('row-action-open-row-1');
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.click(openBtn);

    await waitFor(() => {
      expect(mockOpenRow).toHaveBeenCalledWith('row-1');
    });

    // Menu should not contain duplicate or delete items
    const trigger = await waitFor(() => {
      const el = canvas.getByTestId('row-action-trigger-row-1');
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.click(trigger);

    await waitFor(() => {
      const menu = document.querySelector(
        '[data-testid="row-action-menu-row-1"]',
      );
      expect(menu).toBeTruthy();
    });

    expect(document.querySelector('[data-value="duplicate"]')).toBeNull();
    expect(document.querySelector('[data-value="delete"]')).toBeNull();

    await userEvent.keyboard('{Escape}');
  },
};
