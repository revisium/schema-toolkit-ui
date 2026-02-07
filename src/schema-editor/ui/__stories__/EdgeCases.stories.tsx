import type { Meta, StoryObj } from '@storybook/react';
import { UpdatingStoryWrapper, updatingBaseMeta } from './shared';
import {
  longFieldNamesSchema,
  unicodeFieldsSchema,
  simpleSchema,
} from './schemas';

const meta: Meta<typeof UpdatingStoryWrapper> = {
  ...updatingBaseMeta,
  title: 'SchemaEditor/EdgeCases',
};
export default meta;
type Story = StoryObj<typeof UpdatingStoryWrapper>;

export const LongFieldNames: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={longFieldNamesSchema}
      tableId="long-names"
      hint="Fields with very long names - tests text overflow and layout."
    />
  ),
};

export const LongTableName: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="this-is-a-very-long-table-name-that-might-cause-layout-issues-in-the-ui"
      hint="Very long table name - tests header and dialog layout."
    />
  ),
};

export const UnicodeFieldNames: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={unicodeFieldsSchema}
      tableId="unicode"
      hint="Field names with unicode characters (emoji, cyrillic, japanese)."
    />
  ),
};

export const UnicodeTableName: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="таблица_данных"
      hint="Table name with cyrillic characters."
    />
  ),
};

export const SingleCharacterNames: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="a"
      hint="Single character table name."
    />
  ),
};

export const MaxLengthTableName: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId={'a'.repeat(64)}
      hint="Table name at maximum allowed length (64 characters)."
    />
  ),
};

export const OverMaxLengthTableName: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId={'a'.repeat(65)}
      hint="Table name exceeding maximum length (65 characters) - should show error."
    />
  ),
};
