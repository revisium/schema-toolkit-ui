import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, screen, userEvent } from 'storybook/test';
import { SortModel } from '../../model/SortModel.js';
import type { ColumnSpec } from '../../../Columns/model/types.js';
import { FilterFieldType } from '../../../shared/field-types.js';
import { SortingsWidget } from '../SortingsWidget.js';

const TEST_COLUMNS: ColumnSpec[] = [
  {
    field: 'name',
    label: 'Name',
    fieldType: FilterFieldType.String,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
  },
  {
    field: 'age',
    label: 'Age',
    fieldType: FilterFieldType.Number,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
  },
  {
    field: 'active',
    label: 'Active',
    fieldType: FilterFieldType.Boolean,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
  },
];

interface StoryWrapperProps {
  setup?: (model: SortModel) => void;
}

const StoryWrapper = observer(({ setup }: StoryWrapperProps) => {
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
      onApply={() => {}}
    />
  );
});

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/SortingsWidget',
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const Empty: Story = {};

export const WithOneSort: Story = {
  args: {
    setup: (m: SortModel) => {
      m.addSort('name', 'asc');
    },
  },
};

export const WithMultipleSorts: Story = {
  args: {
    setup: (m: SortModel) => {
      m.addSort('name', 'asc');
      m.addSort('age', 'desc');
    },
  },
};

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

export const ToggleDirection: Story = {
  tags: ['test'],
  args: {
    setup: (m: SortModel) => {
      m.addSort('name', 'asc');
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const trigger = canvas.getByTestId('sort-trigger');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('toggle-direction')).toBeVisible();
    });

    const model = (window as any).__testModel as SortModel;
    expect(model.sorts[0]?.direction).toBe('asc');

    await userEvent.click(screen.getByTestId('toggle-direction'));

    await waitFor(() => {
      expect(model.sorts[0]?.direction).toBe('desc');
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
