import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, screen, userEvent } from 'storybook/test';
import { SortModel } from '../../../model/SortModel.js';
import { SortingsWidget } from '../../SortingsWidget.js';
import {
  TEST_COLUMNS,
  type SortStoryWrapperProps,
} from '../SortingsWidget.stories.js';

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
  title: 'TableEditor/Sort/E2E/SortingsWidget',
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

export const AddAndRemoveSort: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const trigger = canvas.getByTestId('sort-trigger');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('add-sort')).toBeVisible();
    });

    await userEvent.click(screen.getByTestId('add-sort'));

    await waitFor(() => {
      expect(screen.getByTestId('sort-row')).toBeVisible();
    });

    await userEvent.click(screen.getByTestId('remove-sort'));

    await waitFor(() => {
      expect(screen.queryByTestId('sort-row')).toBeNull();
    });
  },
};

export const ChangeDirection: Story = {
  tags: ['test'],
  args: {
    setup: (m: SortModel) => {
      m.addSort('name', 'asc');
      m.apply();
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const model = (window as any).__testModel as SortModel;

    expect(model.hasPendingChanges).toBe(false);

    const trigger = canvas.getByTestId('sort-trigger');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('sort-direction-select')).toBeVisible();
    });

    expect(screen.queryByText('Unsaved')).toBeNull();

    await userEvent.click(screen.getByTestId('sort-direction-select'));

    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);
    });

    const menuItems = screen.getAllByRole('menuitem');
    const descItem = menuItems.find((item) =>
      item.textContent?.includes('Z—A'),
    );
    if (descItem) {
      await userEvent.click(descItem);
    }

    await waitFor(() => {
      expect(model.sorts[0]?.direction).toBe('desc');
      expect(model.hasPendingChanges).toBe(true);
    });

    await waitFor(() => {
      expect(screen.getByText('Unsaved')).toBeVisible();
    });
  },
};

export const ClearAllSorts: Story = {
  tags: ['test'],
  args: {
    setup: (m: SortModel) => {
      m.addSort('name', 'asc');
      m.addSort('age', 'desc');
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const trigger = canvas.getByTestId('sort-trigger');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('clear-all-sorts')).toBeVisible();
    });

    await userEvent.click(screen.getByTestId('clear-all-sorts'));

    const model = (window as any).__testModel as SortModel;
    await waitFor(() => {
      expect(model.sorts).toHaveLength(0);
    });
  },
};

export const BadgePendingAfterAdd: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const model = (window as any).__testModel as SortModel;

    expect(canvas.queryByTestId('sort-badge')).toBeNull();

    const trigger = canvas.getByTestId('sort-trigger');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('add-sort')).toBeVisible();
    });

    await userEvent.click(screen.getByTestId('add-sort'));

    await waitFor(() => {
      expect(model.hasPendingChanges).toBe(true);
    });

    await waitFor(() => {
      const badge = canvas.getByTestId('sort-badge');
      expect(badge).toBeVisible();
      expect(badge.textContent).toBe('1');
    });
  },
};

export const BadgeGrayAfterApply: Story = {
  tags: ['test'],
  args: {
    setup: (m: SortModel) => {
      m.addSort('name', 'asc');
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const model = (window as any).__testModel as SortModel;

    expect(model.hasPendingChanges).toBe(true);

    const trigger = canvas.getByTestId('sort-trigger');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('apply-sorts')).toBeVisible();
    });

    await userEvent.click(screen.getByTestId('apply-sorts'));

    await waitFor(() => {
      expect(model.hasPendingChanges).toBe(false);
      expect(model.hasAppliedSorts).toBe(true);
    });

    await waitFor(() => {
      const badge = canvas.getByTestId('sort-badge');
      expect(badge).toBeVisible();
      expect(badge.textContent).toBe('1');
    });
  },
};

export const BadgeDisappearsAfterClearAll: Story = {
  tags: ['test'],
  args: {
    setup: (m: SortModel) => {
      m.addSort('name', 'asc');
      m.apply();
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const model = (window as any).__testModel as SortModel;

    expect(canvas.getByTestId('sort-badge')).toBeVisible();

    const trigger = canvas.getByTestId('sort-trigger');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('clear-all-sorts')).toBeVisible();
    });

    await userEvent.click(screen.getByTestId('clear-all-sorts'));

    await waitFor(() => {
      expect(model.hasAppliedSorts).toBe(false);
      expect(model.hasPendingChanges).toBe(false);
    });

    await waitFor(() => {
      expect(canvas.queryByTestId('sort-badge')).toBeNull();
    });
  },
};

export const SwapFieldRemovesDuplicate: Story = {
  tags: ['test'],
  args: {
    setup: (m: SortModel) => {
      m.addSort('name', 'asc');
      m.addSort('age', 'desc');
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const model = (window as any).__testModel as SortModel;

    const trigger = canvas.getByTestId('sort-trigger');
    await userEvent.click(trigger);

    await waitFor(() => {
      const rows = screen.getAllByTestId('sort-row');
      expect(rows).toHaveLength(2);
    });

    const fieldSelects = screen.getAllByTestId('sort-field-select');
    await userEvent.click(fieldSelects[0]!);

    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBe(TEST_COLUMNS.length);
    });

    const menuItems = screen.getAllByRole('menuitem');
    const ageItem = menuItems.find((item) => item.textContent?.includes('Age'));
    expect(ageItem).toBeTruthy();
    await userEvent.click(ageItem!);

    await waitFor(() => {
      expect(model.sorts).toHaveLength(1);
      expect(model.sorts[0]?.field).toBe('age');
      expect(model.sorts[0]?.direction).toBe('asc');
    });
  },
};
