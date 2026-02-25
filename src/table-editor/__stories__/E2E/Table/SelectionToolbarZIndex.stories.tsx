import { useEffect, useState } from 'react';
import { Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, waitFor } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import {
  createTableEditorStoryState,
  type TableEditorStoryState,
} from '../../helpers.js';
import { TableEditor } from '../../../TableEditor/ui/TableEditor.js';
import {
  TABLE_SCHEMA,
  MOCK_ROWS_DATA,
} from '../../../Table/ui/__stories__/tableTestData.js';

ensureReactivityProvider();

const StoryWrapper = observer(() => {
  const [state] = useState(() =>
    createTableEditorStoryState({
      dataSchema: TABLE_SCHEMA,
      rowsData: MOCK_ROWS_DATA,
      callbacks: {
        onOpenRow: () => {},
        onDeleteRow: () => {},
      },
    }),
  );

  useEffect(() => {
    (window as any).__testState = state;
    return () => {
      delete (window as any).__testState;
    };
  }, [state]);

  return (
    <Flex minHeight="100vh">
      <Flex alignItems="center" flex={1} flexDirection="column" width="100%">
        <Flex
          flex={1}
          flexDirection="column"
          maxWidth="900px"
          padding="0 1rem"
          width="100%"
        >
          <TableEditor viewModel={state.core} useWindowScroll />
        </Flex>
      </Flex>
    </Flex>
  );
});

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/E2E/Table/SelectionToolbarZIndex',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const ToolbarAboveFooter: Story = {
  tags: ['test'],
  play: async () => {
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    await waitFor(() => {
      expect(state.core.isBootstrapping).toBe(false);
    });

    state.core.selection.toggle('row-1');

    await waitFor(() => {
      const toolbar = document.querySelector(
        '[data-testid="selection-toolbar"]',
      );
      expect(toolbar).toBeTruthy();
    });

    const positioner = document
      .querySelector('[data-testid="selection-toolbar"]')
      ?.closest(
        '[data-scope="action-bar"][data-part="positioner"]',
      ) as HTMLElement | null;

    if (positioner) {
      const zIndex = parseInt(window.getComputedStyle(positioner).zIndex, 10);
      expect(zIndex).toBeGreaterThanOrEqual(5);
    }
  },
};
