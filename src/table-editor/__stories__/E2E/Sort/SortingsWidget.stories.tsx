import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, screen, userEvent } from 'storybook/test';
import { SortModel } from '../../../Sortings/model/SortModel.js';
import { SortingsWidget } from '../../../Sortings/ui/SortingsWidget.js';
import {
  TEST_COLUMNS,
  type SortStoryWrapperProps,
} from '../../../Sortings/ui/__stories__/SortingsWidget.stories.js';

const E2EWrapper = observer(({ setup }: SortStoryWrapperProps) => {
  const [model] = useState(() => {
    const m = new SortModel();
    m.init(TEST_COLUMNS);
    if (setup) {
      setup(m);
    }
    return m;
  });

  useEffect(() => {
    (window as any).__testModel = model;
  }, [model]);

  return (
    <SortingsWidget
      model={model}
      availableFields={TEST_COLUMNS}
      onChange={() => {}}
    />
  );
});

const meta: Meta<typeof E2EWrapper> = {
  component: E2EWrapper as any,
  title: 'TableEditor/E2E/Sort/SortingsWidget',
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

async function openPopover(canvas: ReturnType<typeof within>) {
  const trigger = canvas.getByTestId('sort-trigger');
  await userEvent.click(trigger);
  await waitFor(() => {
    expect(screen.getByTestId('add-sort')).toBeVisible();
  });
}

export const FullSortWorkflow: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const model = () => (window as any).__testModel as SortModel;

    // 1. Open popover — empty, no badge, no rows, no copy-json
    expect(canvas.queryByTestId('sort-badge')).toBeNull();
    await openPopover(canvas);
    expect(screen.queryByTestId('sort-row')).toBeNull();
    expect(screen.queryByText('Unsaved')).toBeNull();
    expect(screen.queryByTestId('sort-copy-json')).toBeNull();

    // 2. Add sort — Name asc, row visible, Unsaved, copy-json visible
    await userEvent.click(screen.getByTestId('add-sort'));
    await waitFor(() => {
      expect(screen.getByTestId('sort-row')).toBeVisible();
    });
    expect(screen.getByTestId('sort-field-select')).toHaveTextContent('Name');
    expect(screen.getByText('Unsaved')).toBeVisible();
    expect(model().hasPendingChanges).toBe(true);
    expect(screen.getByTestId('sort-copy-json')).toBeVisible();

    // 3. Apply — closes, badge=1, no Unsaved
    await userEvent.click(screen.getByTestId('apply-sorts'));
    await waitFor(() => {
      expect(model().hasPendingChanges).toBe(false);
    });
    await waitFor(() => {
      const badge = canvas.getByTestId('sort-badge');
      expect(badge).toBeVisible();
      expect(badge.textContent).toBe('1');
    });

    // 4. Reopen — sort preserved, sort-copy-json visible
    await openPopover(canvas);
    expect(screen.getByTestId('sort-row')).toBeVisible();
    expect(screen.getByTestId('sort-field-select')).toHaveTextContent('Name');
    expect(screen.queryByText('Unsaved')).toBeNull();
    expect(screen.getByTestId('sort-copy-json')).toBeVisible();

    // 5. Change direction to desc — Unsaved, sort-copy-json still visible
    await userEvent.click(screen.getByTestId('sort-direction-select'));
    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);
    });
    const descItem = screen
      .getAllByRole('menuitem')
      .find((item) => item.textContent?.includes('Z—A'));
    if (descItem) {
      await userEvent.click(descItem);
    }
    await waitFor(() => {
      expect(model().sorts[0]?.direction).toBe('desc');
      expect(model().hasPendingChanges).toBe(true);
    });
    expect(screen.getByText('Unsaved')).toBeVisible();
    expect(screen.getByTestId('sort-copy-json')).toBeVisible();

    // 6. Apply — badge=1
    await userEvent.click(screen.getByTestId('apply-sorts'));
    await waitFor(() => {
      expect(model().hasPendingChanges).toBe(false);
    });
    expect(canvas.getByTestId('sort-badge')).toHaveTextContent('1');

    await openPopover(canvas);
    expect(screen.getByTestId('sort-copy-json')).toBeVisible();

    // 7. Add second sort (Age) — count=2, Unsaved, copy-json visible
    await userEvent.click(screen.getByTestId('add-sort'));
    await waitFor(() => {
      const rows = screen.getAllByTestId('sort-row');
      expect(rows).toHaveLength(2);
    });
    expect(screen.getByText('Unsaved')).toBeVisible();
    expect(screen.getByTestId('sort-copy-json')).toBeVisible();

    // 8. Apply — badge=2
    await userEvent.click(screen.getByTestId('apply-sorts'));
    await waitFor(() => {
      expect(model().hasPendingChanges).toBe(false);
    });
    expect(canvas.getByTestId('sort-badge')).toHaveTextContent('2');

    // 9. Swap first field to Age — duplicate removed, count=1
    await openPopover(canvas);
    const fieldSelects = screen.getAllByTestId('sort-field-select');
    await userEvent.click(fieldSelects[0]!);
    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBe(TEST_COLUMNS.length);
    });
    const ageItem = screen
      .getAllByRole('menuitem')
      .find((item) => item.textContent?.includes('Age'));
    expect(ageItem).toBeTruthy();
    await userEvent.click(ageItem!);
    await waitFor(() => {
      expect(model().sorts).toHaveLength(1);
      expect(model().sorts[0]?.field).toBe('age');
      expect(model().sorts[0]?.direction).toBe('desc');
    });

    // 10. Apply
    await userEvent.click(screen.getByTestId('apply-sorts'));
    await waitFor(() => {
      expect(model().hasPendingChanges).toBe(false);
    });
    expect(canvas.getByTestId('sort-badge')).toHaveTextContent('1');

    // 11. Clear all — no badge, no sorts, sort-copy-json hidden
    await openPopover(canvas);
    await userEvent.click(screen.getByTestId('clear-all-sorts'));
    await waitFor(() => {
      expect(model().sorts).toHaveLength(0);
      expect(model().hasPendingChanges).toBe(false);
    });
    await waitFor(() => {
      expect(canvas.queryByTestId('sort-badge')).toBeNull();
    });

    // 12. Reopen — empty
    await openPopover(canvas);
    expect(screen.queryByTestId('sort-row')).toBeNull();
    expect(screen.queryByTestId('sort-copy-json')).toBeNull();
  },
};
