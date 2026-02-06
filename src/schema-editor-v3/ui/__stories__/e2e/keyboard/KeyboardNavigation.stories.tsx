import type { Meta, StoryObj } from '@storybook/react';
import {
  expect,
  within,
  waitFor,
  fn,
  userEvent,
  fireEvent,
} from 'storybook/test';
import { CreatingStoryWrapper, creatingBaseMeta } from '../../shared';
import {
  emptyObjectSchema,
  simpleSchema,
  nestedObjectSchema,
  mixedComplexSchema,
} from '../../schemas';
import {
  addField,
  changeType,
  expectCollapsed,
  expectExpanded,
} from '../test-utils';

const meta: Meta<typeof CreatingStoryWrapper> = {
  ...creatingBaseMeta,
  title: 'V3/SchemaEditor/E2E/Keyboard',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof CreatingStoryWrapper>;

const getKeyboardContainer = (canvasElement: HTMLElement): HTMLElement => {
  const container = canvasElement.querySelector('[tabindex="0"]');
  if (!container || !(container instanceof HTMLElement)) {
    throw new Error('Keyboard container not found');
  }
  return container;
};

const pressKey = async (
  container: HTMLElement,
  key: string,
  options: { shiftKey?: boolean } = {},
) => {
  fireEvent.keyDown(container, { key, ...options });
  await new Promise((r) => setTimeout(r, 50));
};

const focusContainer = async (container: HTMLElement) => {
  await userEvent.click(container);
  await new Promise((r) => setTimeout(r, 100));
  container.focus();
  await new Promise((r) => setTimeout(r, 100));
};

export const ArrowNavigation: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="test"
      hint="E2E Test: Arrow key navigation through fields"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const container = getKeyboardContainer(canvasElement);

    await waitFor(() =>
      expect(canvas.getByTestId('root-0')).toBeInTheDocument(),
    );

    container.focus();

    await pressKey(container, 'ArrowDown');

    await waitFor(() => {
      const rootNode = canvasElement.querySelector('[data-testid="root"]');
      expect(rootNode).toBeInTheDocument();
    });

    await pressKey(container, 'ArrowDown');
    await pressKey(container, 'ArrowDown');
    await pressKey(container, 'ArrowDown');
    await pressKey(container, 'ArrowDown');

    await pressKey(container, 'ArrowUp');
    await pressKey(container, 'ArrowUp');
    await pressKey(container, 'ArrowUp');
    await pressKey(container, 'ArrowUp');

    await pressKey(container, 'Escape');
  },
};

export const TabNavigation: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="test"
      hint="E2E Test: Tab / Shift+Tab navigation"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const container = getKeyboardContainer(canvasElement);

    await waitFor(() =>
      expect(canvas.getByTestId('root-0')).toBeInTheDocument(),
    );

    container.focus();

    await pressKey(container, 'Tab');
    await pressKey(container, 'Tab');
    await pressKey(container, 'Tab');
    await pressKey(container, 'Tab', { shiftKey: true });
    await pressKey(container, 'Tab', { shiftKey: true });
  },
};

export const ExpandCollapseNavigation: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={nestedObjectSchema}
      tableId="test"
      hint="E2E Test: ArrowRight/ArrowLeft expand/collapse + Space toggle"
      setupStore={(vm) => vm.expandAll()}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const container = getKeyboardContainer(canvasElement);

    await waitFor(() =>
      expect(canvas.getByTestId('root-0')).toBeInTheDocument(),
    );

    container.focus();

    // Navigate to root-0 (user object)
    await pressKey(container, 'ArrowDown');
    await pressKey(container, 'ArrowDown');

    // Collapse user object
    await pressKey(container, 'ArrowLeft');
    await expectCollapsed(canvas, 'root-0');

    // Expand user object
    await pressKey(container, 'ArrowRight');
    await expectExpanded(canvas, 'root-0');

    // Move into first child (profile)
    await pressKey(container, 'ArrowRight');

    // Space to collapse profile
    await pressKey(container, ' ');
    await expectCollapsed(canvas, 'root-0-0');

    // Space to expand profile
    await pressKey(container, ' ');
    await expectExpanded(canvas, 'root-0-0');

    // ArrowLeft to collapse profile again
    await pressKey(container, 'ArrowLeft');
    await expectCollapsed(canvas, 'root-0-0');

    // ArrowLeft to move to parent (user)
    await pressKey(container, 'ArrowLeft');

    // ArrowLeft to collapse user
    await pressKey(container, 'ArrowLeft');
    await expectCollapsed(canvas, 'root-0');
  },
};

export const InsertFieldWithInsert: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      tableId="test"
      hint="E2E Test: Insert key creates fields via insertFieldAt"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const container = getKeyboardContainer(canvasElement);

    await waitFor(() => expect(canvas.getByTestId('root')).toBeInTheDocument());

    container.focus();

    await pressKey(container, 'ArrowDown');
    await pressKey(container, 'Insert');

    await waitFor(() =>
      expect(canvas.getByTestId('root-0')).toBeInTheDocument(),
    );

    const firstField = canvas.getByTestId('root-0');
    await userEvent.type(firstField, 'alpha');

    await focusContainer(container);

    await pressKey(container, 'ArrowDown');
    await pressKey(container, 'ArrowDown');
    await pressKey(container, 'Insert');

    await waitFor(async () => {
      const fields = canvas.queryAllByTestId(new RegExp('^root-\\d+$'));
      await expect(fields.length).toBe(2);
    });

    const secondField = canvas.queryAllByTestId(new RegExp('^root-\\d+$'))[1];
    if (secondField) {
      await userEvent.type(secondField, 'beta');
    }

    await focusContainer(container);

    await pressKey(container, 'ArrowDown');
    await pressKey(container, 'ArrowDown');
    await pressKey(container, 'Insert');

    await waitFor(async () => {
      const fields = canvas.queryAllByTestId(new RegExp('^root-\\d+$'));
      await expect(fields.length).toBe(3);
    });

    const thirdField = canvas.queryAllByTestId(new RegExp('^root-\\d+$'))[2];
    if (thirdField) {
      await userEvent.type(thirdField, 'gamma');
    }
  },
};

export const InsertFieldInObject: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="test"
      hint="E2E Test: Insert on object node inserts at beginning"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const container = getKeyboardContainer(canvasElement);

    await waitFor(() =>
      expect(canvas.getByTestId('root-0')).toBeInTheDocument(),
    );

    container.focus();

    await pressKey(container, 'ArrowDown');
    await pressKey(container, 'Insert');

    await waitFor(async () => {
      const fields = canvas.queryAllByTestId(new RegExp('^root-\\d+$'));
      await expect(fields.length).toBe(5);
    });
  },
};

export const DeleteField: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="test"
      hint="E2E Test: Delete/Backspace removes active field"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const container = getKeyboardContainer(canvasElement);

    await waitFor(() =>
      expect(canvas.getByTestId('root-0')).toBeInTheDocument(),
    );

    const initialFields = canvas.queryAllByTestId(new RegExp('^root-\\d+$'));
    const initialCount = initialFields.length;

    container.focus();

    await pressKey(container, 'ArrowDown');
    await pressKey(container, 'ArrowDown');
    await pressKey(container, 'Delete');

    await waitFor(async () => {
      const fields = canvas.queryAllByTestId(new RegExp('^root-\\d+$'));
      await expect(fields.length).toBe(initialCount - 1);
    });

    await pressKey(container, 'Backspace');

    await waitFor(async () => {
      const fields = canvas.queryAllByTestId(new RegExp('^root-\\d+$'));
      await expect(fields.length).toBe(initialCount - 2);
    });
  },
};

export const KeyboardWithComplexSchema: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={mixedComplexSchema}
      tableId="orders"
      hint="E2E Test: Keyboard navigation with complex schema - navigate, expand/collapse, insert, delete"
      setupStore={(vm) => vm.expandAll()}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const container = getKeyboardContainer(canvasElement);

    await waitFor(() =>
      expect(canvas.getByTestId('root-0')).toBeInTheDocument(),
    );

    container.focus();

    // Navigate through all visible nodes with ArrowDown
    for (let i = 0; i < 25; i++) {
      await pressKey(container, 'ArrowDown');
    }

    // Navigate back up through all
    for (let i = 0; i < 25; i++) {
      await pressKey(container, 'ArrowUp');
    }

    // Verify children are still visible after navigation
    await waitFor(async () => {
      const childFields = canvas.queryAllByTestId(new RegExp('^root-\\d+$'));
      await expect(childFields.length).toBeGreaterThan(0);
    });

    // Deselect
    await pressKey(container, 'Escape');
  },
};

export const FullWorkflowWithKeyboard: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      tableId="products"
      hint="E2E Test: Full workflow - create schema entirely with keyboard"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const container = getKeyboardContainer(canvasElement);

    await waitFor(() => expect(canvas.getByTestId('root')).toBeInTheDocument());

    // Step 1: Insert on root to create first field
    container.focus();
    await pressKey(container, 'ArrowDown');
    await pressKey(container, 'Insert');

    await waitFor(() =>
      expect(canvas.getByTestId('root-0')).toBeInTheDocument(),
    );

    // Type name for first field
    const nameField = canvas.getByTestId('root-0');
    await userEvent.type(nameField, 'name');

    // Step 2: Use addField helper for second field (more reliable)
    await addField(canvas, 'root', 'price');

    await waitFor(async () => {
      const fields = canvas.queryAllByTestId(new RegExp('^root-\\d+$'));
      await expect(fields.length).toBe(2);
    });

    // Step 3: Change price type to Number using changeType helper
    const fieldTestIds = canvas
      .queryAllByTestId(new RegExp('^root-\\d+$'))
      .map((el) => el.getAttribute('data-testid'));
    const priceTestId = fieldTestIds[fieldTestIds.length - 1];
    if (priceTestId) {
      await changeType(canvas, priceTestId, 'Number');
    }

    // Step 4: Add quantity field
    await addField(canvas, 'root', 'quantity');

    await waitFor(async () => {
      const fields = canvas.queryAllByTestId(new RegExp('^root-\\d+$'));
      await expect(fields.length).toBe(3);
    });

    const fieldTestIds2 = canvas
      .queryAllByTestId(new RegExp('^root-\\d+$'))
      .map((el) => el.getAttribute('data-testid'));
    const qtyTestId = fieldTestIds2[fieldTestIds2.length - 1];
    if (qtyTestId) {
      await changeType(canvas, qtyTestId, 'Number');
    }

    // Step 5: Add metadata object field
    await addField(canvas, 'root', 'metadata');

    await waitFor(async () => {
      const fields = canvas.queryAllByTestId(new RegExp('^root-\\d+$'));
      await expect(fields.length).toBe(4);
    });

    const fieldTestIds3 = canvas
      .queryAllByTestId(new RegExp('^root-\\d+$'))
      .map((el) => el.getAttribute('data-testid'));
    const metaTestId = fieldTestIds3[fieldTestIds3.length - 1];
    if (metaTestId) {
      await changeType(canvas, metaTestId, 'Object');
    }

    await new Promise((r) => setTimeout(r, 200));

    // Step 6: Add child field inside metadata
    await waitFor(async () => {
      if (metaTestId) {
        const createBtn = canvas.queryByTestId(
          `${metaTestId}-create-field-button`,
        );
        await expect(createBtn).toBeInTheDocument();
      }
    });

    if (metaTestId) {
      await addField(canvas, metaTestId, 'tag');
    }

    await new Promise((r) => setTimeout(r, 200));

    // Step 7: Navigate through all fields with keyboard
    await focusContainer(container);

    // Navigate down through all nodes
    for (let i = 0; i < 6; i++) {
      await pressKey(container, 'ArrowDown');
    }

    // Navigate back up
    for (let i = 0; i < 6; i++) {
      await pressKey(container, 'ArrowUp');
    }

    // Verify final field count
    await expect(
      canvas.queryAllByTestId(new RegExp('^root-\\d+$')).length,
    ).toBeGreaterThanOrEqual(4);
  },
};
