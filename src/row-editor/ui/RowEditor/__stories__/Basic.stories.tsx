import type { Meta, StoryObj } from '@storybook/react';
import { StoryWrapper, baseMeta } from './shared';
import { simpleSchema, nestedSchema, arraySchema } from './schemas';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/Basic',
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const Empty: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={simpleSchema}
      hint="Empty form with default values. Edit fields and click Save."
    />
  ),
};

export const WithData: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={simpleSchema}
      initialValue={{
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        active: true,
      }}
      hint="Form with pre-filled data. Edit and save changes."
    />
  ),
};

export const NestedObject: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={nestedSchema}
      initialValue={{
        name: 'Jane Smith',
        address: {
          street: '123 Main St',
          city: 'New York',
          zip: '10001',
        },
      }}
      hint="Nested object with address. Click to expand/collapse."
    />
  ),
};

export const WithArray: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={arraySchema}
      initialValue={{
        title: 'My Article',
        tags: ['react', 'typescript', 'mobx'],
      }}
      hint="Form with array field. Items can be expanded."
    />
  ),
};

export const ReadOnly: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={simpleSchema}
      initialValue={{
        name: 'Read Only User',
        email: 'readonly@example.com',
        age: 25,
        active: false,
      }}
      mode="reading"
      hint="Read-only mode. Fields cannot be edited."
    />
  ),
};

export const Creating: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={simpleSchema}
      mode="creating"
      hint="Creating mode. Fill in the form and save."
    />
  ),
};
