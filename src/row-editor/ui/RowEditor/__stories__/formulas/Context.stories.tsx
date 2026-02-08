import type { Meta, StoryObj } from '@storybook/react';
import { StoryWrapper, baseMeta } from '../shared';
import {
  indexTokenSchema,
  lengthTokenSchema,
  firstTokenSchema,
  lastTokenSchema,
  prevTokenSchema,
  nextTokenSchema,
  runningTotalSchema,
  parentIndexSchema,
  parentLengthSchema,
  grandparentIndexSchema,
  rootIndexSchema,
  labelGenerationSchema,
  weightedByPositionSchema,
} from './context.schemas';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/Formulas/Context',
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const IndexToken: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={indexTokenSchema}
      initialValue={{
        items: [{ name: 'First' }, { name: 'Second' }, { name: 'Third' }],
      }}
      hint="#index token: 0-based position. position1Based = #index + 1. Add/remove items."
    />
  ),
};

export const LengthToken: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={lengthTokenSchema}
      initialValue={{
        items: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }],
      }}
      hint="#length token: total array size. isHalf = #index < #length / 2. Add/remove items."
    />
  ),
};

export const FirstToken: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={firstTokenSchema}
      initialValue={{
        items: [{ name: 'First' }, { name: 'Second' }, { name: 'Third' }],
      }}
      hint="#first token: true for first element. prefix = #first ? '>> ' : '   '. Add items."
    />
  ),
};

export const LastToken: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={lastTokenSchema}
      initialValue={{
        items: [{ name: 'First' }, { name: 'Second' }, { name: 'Third' }],
      }}
      hint="#last token: true for last element. suffix = #last ? ' (end)' : ''. Add items."
    />
  ),
};

export const PrevToken: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={prevTokenSchema}
      initialValue={{
        items: [{ value: 100 }, { value: 150 }, { value: 120 }],
      }}
      hint="@prev token: access previous element. prevValue shows @prev.value, delta = value - @prev.value."
    />
  ),
};

export const NextToken: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={nextTokenSchema}
      initialValue={{
        items: [{ value: 10 }, { value: 20 }, { value: 30 }],
      }}
      hint="@next token: access next element. nextValue shows @next.value, isIncreasing = @next.value > value."
    />
  ),
};

export const RunningTotal: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={runningTotalSchema}
      initialValue={{
        transactions: [
          { description: 'Deposit', amount: 100 },
          { description: 'Purchase', amount: -25 },
          { description: 'Deposit', amount: 50 },
          { description: 'Purchase', amount: -10 },
        ],
      }}
      hint="Running total: balance = #first ? amount : @prev.balance + amount. Expected: 100, 75, 125, 115."
    />
  ),
};

export const ParentIndex: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={parentIndexSchema}
      initialValue={{
        orders: [
          {
            name: 'Order A',
            items: [{ product: 'Widget' }, { product: 'Gadget' }],
          },
          {
            name: 'Order B',
            items: [{ product: 'Gizmo' }],
          },
        ],
      }}
      hint="#parent.index: access parent array's index. label = 'Order X - Item Y'."
    />
  ),
};

export const ParentLength: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={parentLengthSchema}
      initialValue={{
        groups: [
          { name: 'Group A', members: [{ name: 'Alice' }] },
          { name: 'Group B', members: [{ name: 'Bob' }] },
          { name: 'Group C', members: [{ name: 'Charlie' }] },
        ],
      }}
      hint="#parent.length: parent array size. groupPosition = 'Group X of Y'. Add/remove groups."
    />
  ),
};

export const GrandparentIndex: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={grandparentIndexSchema}
      initialValue={{
        buildings: [
          {
            name: 'Building A',
            floors: [
              {
                level: 1,
                rooms: [{ name: 'Lobby' }, { name: 'Office 101' }],
              },
              {
                level: 2,
                rooms: [{ name: 'Office 201' }],
              },
            ],
          },
          {
            name: 'Building B',
            floors: [
              {
                level: 1,
                rooms: [{ name: 'Reception' }],
              },
            ],
          },
        ],
      }}
      hint="#parent.parent.index: grandparent array index. fullCode = 'B1-F1-R1'. 3 levels of nesting."
    />
  ),
};

export const RootIndex: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={rootIndexSchema}
      initialValue={{
        sections: [
          {
            title: 'Section 1',
            questions: [
              { text: 'Q1', answers: [{ text: 'A' }, { text: 'B' }] },
            ],
          },
          {
            title: 'Section 2',
            questions: [
              { text: 'Q1', answers: [{ text: 'A' }] },
              {
                text: 'Q2',
                answers: [{ text: 'A' }, { text: 'B' }, { text: 'C' }],
              },
            ],
          },
        ],
      }}
      hint="#root.index: topmost array's index. fullNumber = section.question.answer (1.1.1, 1.1.2, etc)."
    />
  ),
};

export const LabelGeneration: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={labelGenerationSchema}
      initialValue={{
        items: [{ name: 'Apple' }, { name: 'Banana' }, { name: 'Cherry' }],
      }}
      hint="Label generation: concat(#index + 1, '. ', name). Result: '1. Apple', '2. Banana', etc."
    />
  ),
};

export const WeightedByPosition: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={weightedByPositionSchema}
      initialValue={{
        items: [{ price: 10 }, { price: 10 }, { price: 10 }],
      }}
      hint="Weighted price: price * (#index + 1). First = 10, Second = 20, Third = 30."
    />
  ),
};
