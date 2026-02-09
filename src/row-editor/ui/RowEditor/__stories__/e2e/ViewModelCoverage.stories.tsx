import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, fn, screen, userEvent } from 'storybook/test';
import { StoryWrapper, baseMeta } from '../shared';
import {
  simpleSchema,
  nestedSchema,
  arraySchema,
  longTextSchema,
  complexSchema,
} from '../schemas';
import {
  editStringField,
  addArrayItem,
  expectRowExists,
  expectRowNotExists,
  expectFieldValue,
  collapseField,
} from './test-utils';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/E2E/ViewModelCoverage',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

const longText = 'A'.repeat(100);

export const LongTextCollapse: Story = {
  args: { onSave: fn(), onChange: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={longTextSchema}
      initialValue={{ title: 'Short', description: longText, content: '' }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      const editor = canvas.getByTestId('description-editor');
      expect(editor).toBeInTheDocument();
    });

    await collapseField(canvas, 'description');

    await waitFor(() => {
      const row = canvas.getByTestId('description');
      expect(row).toHaveTextContent('<text: 1 word>');
    });

    await waitFor(() => {
      const editor = canvas.queryByTestId('description-editor');
      expect(editor).not.toBeInTheDocument();
    });
  },
};

export const LongTextExpand: Story = {
  args: { onSave: fn(), onChange: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={longTextSchema}
      initialValue={{
        title: 'Short',
        description: 'hello world foo bar',
        content: '',
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      const editor = canvas.getByTestId('description-editor');
      expect(editor).toHaveTextContent('hello world foo bar');
    });
  },
};

export const EmptyLongTextLabel: Story = {
  args: { onSave: fn(), onChange: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={longTextSchema}
      initialValue={{
        title: 'T',
        description: '   '.repeat(30),
        content: '',
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      const editor = canvas.getByTestId('description-editor');
      expect(editor).toBeInTheDocument();
    });

    await collapseField(canvas, 'description');

    await waitFor(() => {
      const row = canvas.getByTestId('description');
      expect(row).toHaveTextContent('<empty text>');
    });
  },
};

export const ArrayMoveItem: Story = {
  args: { onSave: fn(), onChange: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={arraySchema}
      initialValue={{ title: 'Article', tags: ['first', 'second', 'third'] }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectFieldValue(canvas, 'tags-0', 'first');
    await expectFieldValue(canvas, 'tags-1', 'second');

    const vm = (window as unknown as Record<string, unknown>).__testVM as {
      root: {
        child(name: string): {
          items: readonly { node: { getPlainValue(): unknown } }[];
          move(from: number, to: number): void;
        };
      };
    };
    const tagsNode = vm.root.child('tags');
    tagsNode.move(1, 0);

    await waitFor(() => {
      expect(tagsNode.items[0].node.getPlainValue()).toBe('second');
      expect(tagsNode.items[1].node.getPlainValue()).toBe('first');
      expect(tagsNode.items[2].node.getPlainValue()).toBe('third');
    });
  },
};

export const ArrayInsertAt: Story = {
  args: { onSave: fn(), onChange: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={arraySchema}
      initialValue={{ title: 'Article', tags: ['alpha', 'beta'] }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectRowExists(canvas, 'tags-0');
    await expectRowExists(canvas, 'tags-1');

    const vm = (window as unknown as Record<string, unknown>).__testVM as {
      root: {
        child(name: string): {
          items: readonly { node: { getPlainValue(): unknown } }[];
          insertAt(index: number): void;
        };
      };
    };
    const tagsNode = vm.root.child('tags');
    tagsNode.insertAt(1);

    await waitFor(() => {
      expect(tagsNode.items).toHaveLength(3);
      expect(tagsNode.items[0].node.getPlainValue()).toBe('alpha');
      expect(tagsNode.items[2].node.getPlainValue()).toBe('beta');
    });
  },
};

export const ExpandAllCollapseAllViaMenu: Story = {
  args: { onSave: fn(), onChange: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={nestedSchema}
      initialValue={{
        name: 'Jane',
        address: { street: '123 Main St', city: 'NY', zip: '10001' },
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectRowExists(canvas, 'address-street');

    const row = canvas.getByTestId('address');
    await userEvent.hover(row);

    await waitFor(() => {
      const menuTrigger = row.querySelector('[data-part="trigger"]');
      expect(menuTrigger).toBeInTheDocument();
    });

    let menuTrigger = row.querySelector('[data-part="trigger"]');
    await userEvent.click(menuTrigger!);

    await waitFor(() => {
      const collapseItem = screen.getByText('Collapse');
      expect(collapseItem).toBeInTheDocument();
    });

    const collapseItem = screen.getByText('Collapse');
    await userEvent.click(collapseItem);

    await expectRowNotExists(canvas, 'address-street');

    await userEvent.hover(row);

    await waitFor(() => {
      const mt = row.querySelector('[data-part="trigger"]');
      expect(mt).toBeInTheDocument();
    });

    menuTrigger = row.querySelector('[data-part="trigger"]');
    await userEvent.click(menuTrigger!);

    await waitFor(() => {
      const expandItem = screen.getByText('Expand');
      expect(expandItem).toBeInTheDocument();
    });

    const expandItem = screen.getByText('Expand');
    await userEvent.click(expandItem);

    await expectRowExists(canvas, 'address-street');
  },
};

export const CollapsedObjectShowsLabel: Story = {
  args: { onSave: fn(), onChange: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={nestedSchema}
      initialValue={{
        name: 'Jane',
        address: { street: '123 Main St', city: 'NY', zip: '10001' },
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await collapseField(canvas, 'address');

    await waitFor(() => {
      const row = canvas.getByTestId('address');
      expect(row).toHaveTextContent('<3 keys>');
    });
  },
};

export const CollapsedArrayShowsLabel: Story = {
  args: { onSave: fn(), onChange: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={arraySchema}
      initialValue={{ title: 'Article', tags: ['a', 'b'] }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await collapseField(canvas, 'tags');

    await waitFor(() => {
      const row = canvas.getByTestId('tags');
      expect(row).toHaveTextContent('<2 items>');
    });
  },
};

export const SingleItemArrayLabel: Story = {
  args: { onSave: fn(), onChange: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={arraySchema}
      initialValue={{ title: 'Article', tags: ['only'] }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await collapseField(canvas, 'tags');

    await waitFor(() => {
      const row = canvas.getByTestId('tags');
      expect(row).toHaveTextContent('<1 item>');
    });
  },
};

export const GetValueAfterEdit: Story = {
  args: { onSave: fn(), onChange: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={simpleSchema}
      initialValue={{ name: 'Start', email: '', age: 0, active: false }}
    />
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await editStringField(canvas, 'name', 'Updated');

    const saveButton = canvas.getByRole('button', { name: /Save/ });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(args.onSave).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ name: 'Updated' }),
        expect.arrayContaining([
          expect.objectContaining({ op: 'replace', path: '/name' }),
        ]),
      );
    });

    await waitFor(() => {
      expect(args.onChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ op: 'replace', path: '/name' }),
        ]),
      );
    });
  },
};

export const ArrayAddItemToEnd: Story = {
  args: { onSave: fn(), onChange: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={arraySchema}
      initialValue={{ title: 'T', tags: ['a'] }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await addArrayItem(canvas, 'tags');
    await addArrayItem(canvas, 'tags');

    await waitFor(() => {
      const items = canvas.queryAllByTestId(/^tags-\d+$/);
      expect(items).toHaveLength(3);
    });

    await expectFieldValue(canvas, 'tags-0', 'a');
  },
};

export const NestedObjectChild: Story = {
  args: { onSave: fn(), onChange: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={complexSchema}
      initialValue={{
        id: '1',
        name: 'Product',
        price: 10,
        quantity: 2,
        items: [
          { sku: 'A', name: 'Item A', price: 5 },
          { sku: 'B', name: 'Item B', price: 3 },
        ],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectRowExists(canvas, 'items-0-sku');
    await expectRowExists(canvas, 'items-1-name');
    await expectFieldValue(canvas, 'items-0-sku', 'A');
    await expectFieldValue(canvas, 'items-1-name', 'Item B');

    await waitFor(() => {
      const row = canvas.getByTestId('total');
      expect(row).toHaveTextContent('20');
    });
  },
};
