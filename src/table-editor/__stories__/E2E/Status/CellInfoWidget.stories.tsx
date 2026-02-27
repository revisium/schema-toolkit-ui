import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import { obj, str, num, numFormula } from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import {
  createTableEditorStoryState,
  type TableEditorStoryState,
} from '../../helpers.js';
import { StoryWrapper } from '../../../TableEditor/__stories__/TableEditor.stories.js';

ensureReactivityProvider();

const PLAIN_SCHEMA = obj({
  name: str(),
  age: num(),
});

const FORMULA_SCHEMA = obj({
  price: num(),
  quantity: num(),
  total: numFormula('price * quantity'),
});

const PLAIN_ROWS = [{ name: 'Alice', age: 30 }];
const FORMULA_ROWS = [{ price: 10, quantity: 5 }];

const PlainWrapper = observer(() => {
  const [state] = useState<TableEditorStoryState>(() =>
    createTableEditorStoryState({
      dataSchema: PLAIN_SCHEMA,
      rowsData: PLAIN_ROWS,
    }),
  );

  useEffect(() => {
    (window as any).__testState = state;
    return () => {
      delete (window as any).__testState;
    };
  }, [state]);

  return <StoryWrapper state={state} />;
});

const FormulaWrapper = observer(() => {
  const [state] = useState<TableEditorStoryState>(() =>
    createTableEditorStoryState({
      dataSchema: FORMULA_SCHEMA,
      rowsData: FORMULA_ROWS,
    }),
  );

  useEffect(() => {
    (window as any).__testState = state;
    return () => {
      delete (window as any).__testState;
    };
  }, [state]);

  return <StoryWrapper state={state} />;
});

const meta: Meta = {
  title: 'TableEditor/E2E/Status/CellInfoWidget',
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj;

export const PlainCellFocus: Story = {
  tags: ['test'],
  render: () => <PlainWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // wait for table to load
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.name')).toBeVisible();
    });

    // no cell focused — widget not visible
    expect(canvas.queryByTestId('cell-info-field')).toBeNull();

    // click a plain cell
    await userEvent.click(canvas.getByTestId('cell-row-1-data.name'));

    await waitFor(() => {
      const field = canvas.getByTestId('cell-info-field');
      expect(field).toBeVisible();
      expect(field.textContent).toBe('name');
    });

    // no formula shown
    expect(canvas.queryByTestId('cell-info-formula')).toBeNull();

    // click another cell — field label updates
    await userEvent.click(canvas.getByTestId('cell-row-1-data.age'));

    await waitFor(() => {
      const field = canvas.getByTestId('cell-info-field');
      expect(field.textContent).toBe('age');
    });
  },
};

export const FormulaCellFocus: Story = {
  tags: ['test'],
  render: () => <FormulaWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // wait for table to load
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.price')).toBeVisible();
    });

    // click plain cell — no formula
    await userEvent.click(canvas.getByTestId('cell-row-1-data.price'));

    await waitFor(() => {
      const field = canvas.getByTestId('cell-info-field');
      expect(field.textContent).toBe('price');
    });
    expect(canvas.queryByTestId('cell-info-formula')).toBeNull();

    // click formula cell
    await userEvent.click(canvas.getByTestId('cell-row-1-data.total'));

    await waitFor(() => {
      const field = canvas.getByTestId('cell-info-field');
      expect(field.textContent).toBe('total');
      const formula = canvas.getByTestId('cell-info-formula');
      expect(formula).toBeVisible();
      expect(formula.textContent).toBe('= price * quantity');
    });
  },
};
