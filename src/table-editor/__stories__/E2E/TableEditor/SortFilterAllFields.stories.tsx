import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, screen, userEvent } from 'storybook/test';
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

function createState(): TableEditorStoryState {
  return createTableEditorStoryState({
    dataSchema: MANY_COLUMNS_SCHEMA,
    rowsData: MANY_COLUMNS_ROWS,
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
  title: 'TableEditor/E2E/TableEditor/SortFilterAllFields',
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

export const SortDropdownShowsAllFields: Story = {
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

    const visibleFields = state.core.columns.visibleColumns.map((c) => c.field);
    expect(visibleFields).toHaveLength(4);
    expect(visibleFields).not.toContain('age');
    expect(visibleFields).not.toContain('active');
    expect(visibleFields).not.toContain('score');

    const sortTrigger = canvas.getByTestId('sort-trigger');
    await userEvent.click(sortTrigger);

    await waitFor(() => {
      expect(screen.getByTestId('add-sort')).toBeVisible();
    });

    await userEvent.click(screen.getByTestId('add-sort'));

    await waitFor(() => {
      expect(screen.getByTestId('sort-row')).toBeVisible();
    });

    const sortableFields = state.core.columns.sortableFields;

    const fieldSelect = screen.getByTestId('sort-field-select');
    await userEvent.click(fieldSelect);

    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBe(sortableFields.length);

      const labels = menuItems.map((item) => item.textContent?.trim());
      for (const field of sortableFields) {
        expect(labels.some((l) => l?.includes(field.label))).toBe(true);
      }
    });
  },
};

export const FilterDropdownShowsAllFields: Story = {
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

    const filterTrigger = canvas.getByTestId('filter-trigger');
    await userEvent.click(filterTrigger);

    await waitFor(() => {
      expect(screen.getByTestId('footer-add-condition')).toBeVisible();
    });

    await userEvent.click(screen.getByTestId('footer-add-condition'));

    await waitFor(() => {
      expect(screen.getByTestId('field-select')).toBeVisible();
    });

    const filterableFields = state.core.columns.filterableFields;

    const filterFieldSelect = screen.getByTestId('field-select');
    await userEvent.click(filterFieldSelect);

    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBe(filterableFields.length);

      const labels = menuItems.map((item) => item.textContent?.trim());
      for (const field of filterableFields) {
        expect(labels.some((l) => l?.includes(field.label))).toBe(true);
      }
    });
  },
};
