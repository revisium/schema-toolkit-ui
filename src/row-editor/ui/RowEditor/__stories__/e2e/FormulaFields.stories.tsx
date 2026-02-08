import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, fn } from 'storybook/test';
import { StoryWrapper, baseMeta } from '../shared';
import { editNumberField, expectRowExists } from './test-utils';

const formulaSchema = {
  type: 'object',
  properties: {
    a: { type: 'number', default: 10 },
    b: { type: 'number', default: 3 },
    sum: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'a + b' },
    },
  },
  additionalProperties: false,
};

const formulaArrayWithRootRefSchema = {
  type: 'object',
  required: ['levels', 'value'],
  properties: {
    value: { type: 'number', default: 0 },
    levels: {
      type: 'array',
      items: {
        type: 'object',
        required: ['exp'],
        properties: {
          exp: {
            type: 'number',
            default: 0,
            readOnly: true,
            'x-formula': {
              version: 1,
              expression: '/value + round(log(#index * 10), 1)',
            },
          },
        },
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
};

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/E2E/FormulaFields',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const FormulaFieldReadOnly: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => <StoryWrapper {...args} schema={formulaSchema} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      const row = canvas.getByTestId('sum');
      expect(row).toBeInTheDocument();
    });

    const sumEditor = canvas.queryByTestId('sum-editor');
    await expect(sumEditor).not.toBeInTheDocument();
  },
};

export const FormulaComputedValue: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => <StoryWrapper {...args} schema={formulaSchema} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      const row = canvas.getByTestId('sum');
      expect(row).toHaveTextContent('13');
    });

    await editNumberField(canvas, 'a', '20');

    await waitFor(() => {
      const row = canvas.getByTestId('sum');
      expect(row).toHaveTextContent('23');
    });
  },
};

export const FormulaIconVisible: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => <StoryWrapper {...args} schema={formulaSchema} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      const sumRow = canvas.getByTestId('sum');
      expect(sumRow).toBeInTheDocument();
    });

    const sumRow = canvas.getByTestId('sum');
    const formulaIcon = sumRow.querySelector('svg');
    await expect(formulaIcon).toBeInTheDocument();
  },
};

const levelsInitialData = {
  value: 10,
  levels: [
    { exp: null },
    { exp: 12.3 },
    { exp: 13 },
    { exp: 13.4 },
    { exp: 13.7 },
    { exp: 13.9 },
    { exp: 14.1 },
    { exp: 14.2 },
  ],
};

export const FormulaArrayWithRootRef: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={formulaArrayWithRootRefSchema}
      initialValue={levelsInitialData}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectRowExists(canvas, 'levels-0-exp');

    const expectedValues = [
      '0',
      '12.3',
      '13',
      '13.4',
      '13.7',
      '13.9',
      '14.1',
      '14.2',
    ];
    for (let i = 0; i < expectedValues.length; i++) {
      await waitFor(() => {
        const row = canvas.getByTestId(`levels-${i}-exp`);
        expect(row).toHaveTextContent(expectedValues[i]);
      });
    }
  },
};

export const FormulaArrayRecalcOnRootChange: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={formulaArrayWithRootRefSchema}
      initialValue={levelsInitialData}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      const row = canvas.getByTestId('levels-1-exp');
      expect(row).toHaveTextContent('12.3');
    });

    await editNumberField(canvas, 'value', '20');

    await waitFor(() => {
      const row = canvas.getByTestId('levels-1-exp');
      expect(row).toHaveTextContent('22.3');
    });
  },
};
