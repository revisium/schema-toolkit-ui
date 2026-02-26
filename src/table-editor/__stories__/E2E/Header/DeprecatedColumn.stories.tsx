import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor } from 'storybook/test';
import { obj, str, strFormula } from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import { createTableStoryState } from '../../helpers.js';
import { TableWidget } from '../../../Table/ui/TableWidget.js';

ensureReactivityProvider();

const SCHEMA_WITH_DEPRECATED = obj({
  name: str(),
  oldField: { type: 'string' as const, default: '', deprecated: true },
  computed: strFormula('"prefix_" + name'),
});

const ROWS_DATA = [{ name: 'Alice' }];

const StoryWrapper = observer(() => {
  const [state] = useState(() =>
    createTableStoryState({
      dataSchema: SCHEMA_WITH_DEPRECATED,
      rowsData: ROWS_DATA,
    }),
  );

  return (
    <Box width="800px" height="300px">
      <TableWidget
        rows={state.rows}
        columnsModel={state.columnsModel}
        cellFSM={state.cellFSM}
        selection={state.selection}
      />
    </Box>
  );
});

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/E2E/Header/DeprecatedColumn',
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

export const DeprecatedAndFormulaIndicators: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const deprecatedHeader = canvas.getByTestId('header-data.oldField');
    await waitFor(() => {
      const label = deprecatedHeader.querySelector('p, span');
      expect(label).toBeTruthy();
      expect(label).toHaveStyle('text-decoration: line-through');
    });

    await waitFor(() => {
      expect(
        canvasElement.querySelector(
          '[data-testid="formula-indicator-data.oldField"]',
        ),
      ).toBeNull();
    });

    const formulaHeader = canvas.getByTestId('header-data.computed');
    await waitFor(() => {
      expect(
        canvasElement.querySelector(
          '[data-testid="formula-indicator-data.computed"]',
        ),
      ).toBeTruthy();
    });

    await waitFor(() => {
      const label = formulaHeader.querySelector('p, span');
      expect(label).toBeTruthy();
      expect(label).not.toHaveStyle('text-decoration: line-through');
    });

    const nameHeader = canvas.getByTestId('header-data.name');
    await waitFor(() => {
      expect(
        canvasElement.querySelector(
          '[data-testid="formula-indicator-data.name"]',
        ),
      ).toBeNull();
    });

    await waitFor(() => {
      const label = nameHeader.querySelector('p, span');
      expect(label).toBeTruthy();
      expect(label).not.toHaveStyle('text-decoration: line-through');
    });
  },
};
