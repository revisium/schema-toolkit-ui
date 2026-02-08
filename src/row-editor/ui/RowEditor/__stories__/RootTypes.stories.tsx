import type { Meta, StoryObj } from '@storybook/react';
import { StoryWrapper, baseMeta } from './shared';
import {
  rootStringSchema,
  rootNumberSchema,
  rootBooleanSchema,
  rootArrayOfStringsSchema,
  rootArrayOfNumbersSchema,
  rootArrayOfObjectsSchema,
  longTextSchema,
} from './schemas';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/RootTypes',
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const RootString: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={rootStringSchema}
      initialValue="Hello, World!"
      hint="Root value is a string. Edit the text directly."
    />
  ),
};

export const RootStringEmpty: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={rootStringSchema}
      hint="Empty root string. Type something to see changes."
    />
  ),
};

export const RootNumber: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={rootNumberSchema}
      initialValue={42}
      hint="Root value is a number. Edit using the number input."
    />
  ),
};

export const RootBoolean: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={rootBooleanSchema}
      initialValue={true}
      hint="Root value is a boolean. Click to toggle."
    />
  ),
};

export const RootArrayOfStrings: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={rootArrayOfStringsSchema}
      initialValue={['apple', 'banana', 'cherry']}
      hint="Root is an array of strings. Add/remove/reorder items."
    />
  ),
};

export const RootArrayOfNumbers: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={rootArrayOfNumbersSchema}
      initialValue={[1, 2, 3, 5, 8, 13]}
      hint="Root is an array of numbers (Fibonacci). Add/remove items."
    />
  ),
};

export const RootArrayOfObjects: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={rootArrayOfObjectsSchema}
      initialValue={[
        { id: 1, name: 'Alice', active: true },
        { id: 2, name: 'Bob', active: false },
        { id: 3, name: 'Charlie', active: true },
      ]}
      hint="Root is an array of objects. Each item has id, name, and active fields."
    />
  ),
};

export const RootEmptyArray: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={rootArrayOfStringsSchema}
      hint="Empty root array. Click +Item to add elements."
    />
  ),
};

export const LongText: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={longTextSchema}
      initialValue={{
        title: 'Article Title',
        description:
          'A short description of the article that fits on one line.',
        content:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
      }}
      hint="Long text field (>64 chars) becomes collapsible. Click to expand/collapse."
    />
  ),
};

export const VeryLongText: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={longTextSchema}
      initialValue={{
        title: 'Very Long Article',
        description:
          'This is a moderately long description that demonstrates how the row editor handles text that exceeds the collapse threshold of 64 characters.',
        content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.`,
      }}
      hint="Multiple long text fields. Each can be expanded independently."
    />
  ),
};
