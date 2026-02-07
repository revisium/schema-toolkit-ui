import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, userEvent, waitFor, fn, screen } from 'storybook/test';
import { CreatingStoryWrapper, creatingBaseMeta } from '../../shared';
import { openSettingsMenu } from '../test-utils';

const scrollableSchema = {
  type: 'object',
  properties: Object.fromEntries(
    Array.from({ length: 25 }, (_, i) => [
      `field${i + 1}`,
      { type: 'number', default: 0 },
    ]),
  ),
  additionalProperties: false,
  required: Array.from({ length: 25 }, (_, i) => `field${i + 1}`),
};

const meta: Meta<typeof CreatingStoryWrapper> = {
  ...creatingBaseMeta,
  title: 'SchemaEditor/E2E/EdgeCases/SubmenuScrollPosition',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof CreatingStoryWrapper>;

export const DescriptionSubmenuPreservesScrollPosition: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={scrollableSchema as any}
      tableId="test-table"
      hint="E2E: Opening description submenu on scrolled field should not reset scroll to top"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const lastFieldTestId = 'root-24';
    await waitFor(() => {
      expect(canvas.queryByTestId(lastFieldTestId)).toBeInTheDocument();
    });

    const lastField = canvas.getByTestId(lastFieldTestId);
    lastField.scrollIntoView({ block: 'center' });

    await new Promise((r) => setTimeout(r, 100));

    const scrollBefore =
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      window.scrollY;
    expect(scrollBefore).toBeGreaterThan(0);

    await openSettingsMenu(canvas, lastFieldTestId);

    const descMenuTestId = `${lastFieldTestId}-setting-button-description-menu`;
    await waitFor(async () => {
      const descOption = screen.getByTestId(descMenuTestId);
      await expect(descOption).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId(descMenuTestId));

    const descInputTestId = `${lastFieldTestId}-setting-button-description-input`;
    await waitFor(async () => {
      const descInput = screen.getByTestId(descInputTestId);
      await expect(descInput).toBeInTheDocument();
    });

    await new Promise((r) => setTimeout(r, 200));

    const scrollAfter =
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      window.scrollY;

    expect(scrollAfter).toBeGreaterThan(0);
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(50);
  },
};

export const FormulaSubmenuPreservesScrollPosition: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={scrollableSchema as any}
      tableId="test-table"
      hint="E2E: Opening formula submenu on scrolled field should not reset scroll to top"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const lastFieldTestId = 'root-24';
    await waitFor(() => {
      expect(canvas.queryByTestId(lastFieldTestId)).toBeInTheDocument();
    });

    const lastField = canvas.getByTestId(lastFieldTestId);
    lastField.scrollIntoView({ block: 'center' });

    await new Promise((r) => setTimeout(r, 100));

    const scrollBefore =
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      window.scrollY;
    expect(scrollBefore).toBeGreaterThan(0);

    await openSettingsMenu(canvas, lastFieldTestId);

    const formulaMenuTestId = `${lastFieldTestId}-setting-button-formula-menu`;
    await waitFor(async () => {
      const formulaOption = screen.getByTestId(formulaMenuTestId);
      await expect(formulaOption).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId(formulaMenuTestId));

    const formulaInputTestId = `${lastFieldTestId}-setting-button-formula-input`;
    await waitFor(async () => {
      const formulaInput = screen.getByTestId(formulaInputTestId);
      await expect(formulaInput).toBeInTheDocument();
    });

    await new Promise((r) => setTimeout(r, 200));

    const scrollAfter =
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      window.scrollY;

    expect(scrollAfter).toBeGreaterThan(0);
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(50);
  },
};
