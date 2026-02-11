import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, screen, userEvent } from 'storybook/test';
import { FilterModel } from '../../model/index.js';
import type { ColumnSpec } from '../../../Columns/model/types.js';
import { FilterFieldType } from '../../../shared/field-types.js';
import { FilterWidget } from '../FilterWidget.js';

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
  setup?: (model: FilterModel) => void;
}

const StoryWrapper = observer(({ setup }: StoryWrapperProps) => {
  const [model] = useState(() => {
    const m = new FilterModel();
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
    <FilterWidget
      model={model}
      availableFields={TEST_COLUMNS}
      onApply={() => {}}
    />
  );
});

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/FilterWidget',
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

export const WithCondition: Story = {
  args: {
    setup: (m: FilterModel) => {
      m.addCondition();
    },
  },
};

export const WithMultipleConditions: Story = {
  args: {
    setup: (m: FilterModel) => {
      m.addCondition();
      m.addCondition();
      m.addCondition();
    },
  },
};

export const WithNestedGroup: Story = {
  args: {
    setup: (m: FilterModel) => {
      m.addCondition();
      m.addGroup();
      const nestedGroup = m.rootGroup.groups[0];
      if (nestedGroup) {
        m.addCondition(nestedGroup.id);
      }
    },
  },
};

export const AddAndRemoveCondition: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const trigger = canvas.getByTestId('filter-trigger');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('footer-add-condition')).toBeVisible();
    });

    const addButton = screen.getByTestId('footer-add-condition');
    await userEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('filter-condition')).toBeVisible();
    });

    const removeButton = screen.getByTestId('remove-condition');
    await userEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('filter-condition')).toBeNull();
    });
  },
};

export const ChangeFieldAndOperator: Story = {
  tags: ['test'],
  args: {
    setup: (m: FilterModel) => {
      m.addCondition();
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const trigger = canvas.getByTestId('filter-trigger');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('field-select')).toBeVisible();
    });

    const fieldSelect = screen.getByTestId('field-select');
    await userEvent.click(fieldSelect);

    await waitFor(() => {
      expect(screen.getByText('Age')).toBeVisible();
    });

    await userEvent.click(screen.getByText('Age'));

    const model = (window as any).__testModel as FilterModel;
    await waitFor(() => {
      const condition = model.rootGroup.conditions[0];
      expect(condition?.fieldType).toBe(FilterFieldType.Number);
    });
  },
};

export const ApplyFilters: Story = {
  tags: ['test'],
  args: {
    setup: (m: FilterModel) => {
      m.addCondition();
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const trigger = canvas.getByTestId('filter-trigger');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('filter-value-input')).toBeVisible();
    });

    const input = screen.getByTestId('filter-value-input');
    await userEvent.type(input, 'test value');

    const applyButton = screen.getByTestId('apply-filters');
    await waitFor(() => {
      expect(applyButton).not.toBeDisabled();
    });

    await userEvent.click(applyButton);

    const model = (window as any).__testModel as FilterModel;
    expect(model.hasActiveFilters).toBe(true);
  },
};

export const NestedGroupWorkflow: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const trigger = canvas.getByTestId('filter-trigger');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('footer-add-condition')).toBeVisible();
    });

    const addConditionButton = screen.getByTestId('footer-add-condition');
    await userEvent.click(addConditionButton);

    await waitFor(() => {
      expect(screen.getByTestId('add-group')).toBeVisible();
    });

    const addGroupButton = screen.getByTestId('add-group');
    await userEvent.click(addGroupButton);

    await waitFor(() => {
      expect(screen.getByTestId('filter-group')).toBeVisible();
    });

    const model = (window as any).__testModel as FilterModel;
    const nestedGroup = model.rootGroup.groups[0];
    expect(nestedGroup).toBeDefined();

    const orButton = within(screen.getByTestId('filter-group')).getByTestId(
      'logic-or',
    );
    await userEvent.click(orButton);

    await waitFor(() => {
      expect(model.rootGroup.groups[0]?.logic).toBe('or');
    });
  },
};
