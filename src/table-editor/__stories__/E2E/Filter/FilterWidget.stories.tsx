import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, screen, userEvent } from 'storybook/test';
import { FilterModel } from '../../../Filters/model/index.js';
import { FilterFieldType } from '../../../shared/field-types.js';
import {
  TEST_COLUMNS,
  type FilterStoryWrapperProps,
} from '../../../Filters/ui/__stories__/FilterWidget.stories.js';
import { FilterWidget } from '../../../Filters/ui/FilterWidget.js';

const E2EWrapper = observer(({ setup }: FilterStoryWrapperProps) => {
  const [model] = useState(() => {
    const m = new FilterModel();
    m.init(TEST_COLUMNS);
    const calls: (Record<string, unknown> | null)[] = [];
    (window as any).__testOnApplyCalls = calls;
    m.setOnApply((where) => {
      calls.push(where);
    });
    if (setup) {
      setup(m);
    }
    return m;
  });

  useEffect(() => {
    (window as any).__testModel = model;
  }, [model]);

  return <FilterWidget model={model} availableFields={TEST_COLUMNS} />;
});

const meta: Meta<typeof E2EWrapper> = {
  component: E2EWrapper as any,
  title: 'TableEditor/E2E/Filter/FilterWidget',
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
  const trigger = canvas.getByTestId('filter-trigger');
  await userEvent.click(trigger);
  await waitFor(() => {
    expect(screen.getByTestId('footer-add-condition')).toBeVisible();
  });
}

export const FullFilterWorkflow: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const model = () => (window as any).__testModel as FilterModel;

    // 1. Open popover — empty state
    await openPopover(canvas);
    expect(screen.queryByTestId('filter-condition')).toBeNull();
    expect(screen.getByTestId('apply-filters')).toBeDisabled();
    expect(screen.queryByTestId('clear-all')).toBeNull();
    expect(canvas.queryByTestId('filter-badge')).toBeNull();

    // 2. Add condition — default field Name, operator equals, value input visible
    await userEvent.click(screen.getByTestId('footer-add-condition'));
    await waitFor(() => {
      expect(screen.getByTestId('filter-condition')).toBeVisible();
    });
    expect(screen.getByTestId('field-select')).toHaveTextContent('Name');
    expect(screen.getByTestId('operator-select')).toHaveTextContent('equals');
    expect(screen.getByTestId('filter-value-input')).toBeVisible();

    // 3. Unsaved badge visible (pending changes)
    expect(screen.getByText('Unsaved')).toBeVisible();

    // 4. Apply still disabled — value empty, filter invalid, no copy-json
    expect(screen.getByTestId('apply-filters')).toBeDisabled();
    expect(screen.queryByTestId('filter-copy-json')).toBeNull();

    // 5. Type value "Alice" — Apply becomes enabled, copy-json appears
    await userEvent.type(screen.getByTestId('filter-value-input'), 'Alice');
    await waitFor(() => {
      expect(screen.getByTestId('apply-filters')).not.toBeDisabled();
    });
    expect(screen.getByTestId('filter-copy-json')).toBeVisible();

    // 6. Apply — popover closes, badge shows count=1, no Unsaved
    await userEvent.click(screen.getByTestId('apply-filters'));
    await waitFor(() => {
      expect(screen.queryByTestId('footer-add-condition')).toBeNull();
    });
    expect(canvas.getByTestId('filter-badge')).toHaveTextContent('1');
    expect(model().hasActiveFilters).toBe(true);
    expect(model().hasPendingChanges).toBe(false);

    // 7. Reopen — condition still "Name equals Alice", filter-copy-json visible
    await openPopover(canvas);
    expect(screen.getByTestId('field-select')).toHaveTextContent('Name');
    expect(screen.getByTestId('operator-select')).toHaveTextContent('equals');
    expect(screen.getByTestId('filter-value-input')).toHaveValue('Alice');
    expect(screen.queryByText('Unsaved')).toBeNull();
    expect(screen.getByTestId('filter-copy-json')).toBeVisible();

    // 8. Change field to Age — operator resets to "=" (Number default), value clears
    await userEvent.click(screen.getByTestId('field-select'));
    await waitFor(() => {
      expect(screen.getByText('Age')).toBeVisible();
    });
    await userEvent.click(screen.getByText('Age'));
    await waitFor(() => {
      expect(model().rootGroup.conditions[0]?.fieldType).toBe(
        FilterFieldType.Number,
      );
    });
    expect(screen.getByTestId('operator-select')).toHaveTextContent('=');
    expect(screen.getByTestId('filter-value-input')).toHaveValue('');
    expect(screen.queryByTestId('filter-copy-json')).toBeNull();

    // 9. Change operator to ">" — value clears
    await userEvent.click(screen.getByTestId('operator-select'));
    await waitFor(() => {
      expect(screen.getByText('>')).toBeVisible();
    });
    await userEvent.click(screen.getByText('>'));
    await waitFor(() => {
      expect(screen.getByTestId('operator-select')).toHaveTextContent('>');
    });

    // 10. Type "25" — Apply enabled, Unsaved visible
    await userEvent.type(screen.getByTestId('filter-value-input'), '25');
    await waitFor(() => {
      expect(screen.getByTestId('apply-filters')).not.toBeDisabled();
    });
    expect(screen.getByText('Unsaved')).toBeVisible();
    expect(screen.getByTestId('filter-copy-json')).toBeVisible();

    // 11. Add second condition — count = 2 in model
    await userEvent.click(screen.getByTestId('footer-add-condition'));
    await waitFor(() => {
      expect(model().totalConditionCount).toBe(2);
    });

    // 12. Switch root logic to "Any" (or)
    const rootLogic = screen.getAllByTestId('logic-select')[0]!;
    await userEvent.click(rootLogic);
    await waitFor(() => {
      expect(screen.getByTestId('logic-or')).toBeVisible();
    });
    await userEvent.click(screen.getByTestId('logic-or'));
    await waitFor(() => {
      expect(model().rootGroup.logic).toBe('or');
    });

    // 13. Add group — nested group visible
    await userEvent.click(screen.getByTestId('footer-add-group'));
    await waitFor(() => {
      expect(screen.getByTestId('filter-group')).toBeVisible();
    });

    // 14. Add condition inside nested group
    const groupEl = screen.getByTestId('filter-group');
    const addInGroup = within(groupEl).getByTestId('add-condition');
    await userEvent.click(addInGroup);
    await waitFor(() => {
      expect(model().totalConditionCount).toBe(3);
    });

    // 15. Change nested condition field to Active (Boolean) — operator = "is true", no value input
    const conditions = screen.getAllByTestId('filter-condition');
    const nestedCondition = conditions[conditions.length - 1]!;
    const nestedFieldSelect =
      within(nestedCondition).getByTestId('field-select');
    await userEvent.click(nestedFieldSelect);
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeVisible();
    });
    await userEvent.click(screen.getByText('Active'));
    await waitFor(() => {
      const nestedGroup = model().rootGroup.groups[0];
      const cond = nestedGroup?.conditions[0];
      expect(cond?.fieldType).toBe(FilterFieldType.Boolean);
    });
    expect(
      within(nestedCondition).getByTestId('operator-select'),
    ).toHaveTextContent('is true');
    expect(
      within(nestedCondition).queryByTestId('filter-value-input'),
    ).toBeNull();

    // 16. Apply — popover closes, badge count=3, hasActiveFilters
    // First fill value for second root condition
    const allConditions = screen.getAllByTestId('filter-condition');
    const secondCondition = allConditions[1]!;
    const secondValueInput =
      within(secondCondition).getByTestId('filter-value-input');
    await userEvent.type(secondValueInput, 'test');
    await waitFor(() => {
      expect(screen.getByTestId('apply-filters')).not.toBeDisabled();
    });
    await userEvent.click(screen.getByTestId('apply-filters'));
    await waitFor(() => {
      expect(screen.queryByTestId('footer-add-condition')).toBeNull();
    });
    expect(canvas.getByTestId('filter-badge')).toHaveTextContent('3');
    expect(model().hasActiveFilters).toBe(true);
    expect(model().hasPendingChanges).toBe(false);

    // 17. Verify onApply was called with correct where clause
    const applyCalls = () =>
      (window as any).__testOnApplyCalls as (Record<string, unknown> | null)[];
    expect(applyCalls()).toHaveLength(2);
    expect(applyCalls()[0]).toEqual({
      data: { path: 'name', equals: 'Alice' },
    });
    expect(applyCalls()[1]).toEqual({
      OR: [
        { data: { path: 'age', gt: 25 } },
        { data: { path: 'name', equals: 'test' } },
        { data: { path: 'active', equals: true } },
      ],
    });

    // 18. Reopen — filters preserved (3 conditions)
    await openPopover(canvas);
    expect(model().totalConditionCount).toBe(3);
    expect(screen.queryByText('Unsaved')).toBeNull();

    // 19. Clear All — everything cleared, popover closes
    await userEvent.click(screen.getByTestId('clear-all'));
    await waitFor(() => {
      expect(screen.queryByTestId('footer-add-condition')).toBeNull();
    });

    // 20. No badge, hasActiveFilters = false
    expect(canvas.queryByTestId('filter-badge')).toBeNull();
    expect(model().hasActiveFilters).toBe(false);

    // 21. Verify onApply called with null on clearAll
    expect(applyCalls()).toHaveLength(3);
    expect(applyCalls()[2]).toBeNull();

    // 22. Reopen — empty popover, filter-copy-json not visible, add Search condition
    await openPopover(canvas);
    expect(screen.queryByTestId('filter-condition')).toBeNull();
    expect(screen.queryByTestId('filter-copy-json')).toBeNull();

    await userEvent.click(screen.getByTestId('footer-add-condition'));
    await waitFor(() => {
      expect(screen.getByTestId('filter-condition')).toBeVisible();
    });

    // 23. Switch operator to "search" — language and type selects appear
    await userEvent.click(screen.getByTestId('operator-select'));
    await waitFor(() => {
      expect(screen.getByText('search')).toBeVisible();
    });
    await userEvent.click(screen.getByText('search'));
    await waitFor(() => {
      expect(screen.getByTestId('search-language-select')).toBeVisible();
    });
    expect(screen.getByTestId('search-type-select')).toBeVisible();
    expect(screen.getByTestId('filter-value-input')).toBeVisible();

    // 24. Default language is "Simple (no stemming)", default type is "Words (any order)"
    expect(screen.getByTestId('search-language-select')).toHaveTextContent(
      'Simple (no stemming)',
    );
    expect(screen.getByTestId('search-type-select')).toHaveTextContent(
      'Words (any order)',
    );

    // 25. Change language to English
    await userEvent.click(screen.getByTestId('search-language-select'));
    await waitFor(() => {
      expect(screen.getByText('English')).toBeVisible();
    });
    await userEvent.click(screen.getByText('English'));
    await waitFor(() => {
      expect(screen.getByTestId('search-language-select')).toHaveTextContent(
        'English',
      );
    });

    // 26. Change type to "Exact phrase"
    await userEvent.click(screen.getByTestId('search-type-select'));
    await waitFor(() => {
      expect(screen.getByText('Exact phrase')).toBeVisible();
    });
    await userEvent.click(screen.getByText('Exact phrase'));
    await waitFor(() => {
      expect(screen.getByTestId('search-type-select')).toHaveTextContent(
        'Exact phrase',
      );
    });

    // 27. Type search value and apply
    await userEvent.type(
      screen.getByTestId('filter-value-input'),
      'hello world',
    );
    await waitFor(() => {
      expect(screen.getByTestId('apply-filters')).not.toBeDisabled();
    });
    await userEvent.click(screen.getByTestId('apply-filters'));
    await waitFor(() => {
      expect(screen.queryByTestId('footer-add-condition')).toBeNull();
    });

    // 28. Verify onApply for search with correct language and type
    expect(applyCalls()).toHaveLength(4);
    expect(applyCalls()[3]).toEqual({
      data: {
        path: 'name',
        search: 'hello world',
        searchLanguage: 'english',
        searchType: 'phrase',
      },
    });

    // 29. Badge shows 1 filter, filter-copy-json visible after reopen
    expect(canvas.getByTestId('filter-badge')).toHaveTextContent('1');
    expect(model().hasActiveFilters).toBe(true);

    await openPopover(canvas);
    expect(screen.getByTestId('filter-copy-json')).toBeVisible();

    // 30. Final clear all
    await userEvent.click(screen.getByTestId('clear-all'));
    await waitFor(() => {
      expect(screen.queryByTestId('footer-add-condition')).toBeNull();
    });
    expect(canvas.queryByTestId('filter-badge')).toBeNull();
    expect(model().hasActiveFilters).toBe(false);
    expect(applyCalls()).toHaveLength(5);
    expect(applyCalls()[4]).toBeNull();
  },
};
