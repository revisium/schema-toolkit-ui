import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import { FilterFieldType } from '../../../../shared/field-types.js';
import type { SearchForeignKeySearchFn } from '../../../../../search-foreign-key/index.js';
import { CellRenderer } from '../CellRenderer';

class MockCellVM {
  private _value: unknown;
  private _isEditing = false;
  private _isFocused = false;

  constructor(
    public readonly field: string,
    private readonly _fieldType: FilterFieldType,
    initialValue: unknown,
    private readonly _isReadOnly: boolean = false,
    private readonly _foreignKeyTableId?: string,
  ) {
    this._value = initialValue;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get column() {
    return {
      field: this.field,
      label: this.field,
      fieldType: this._fieldType,
      isSystem: false,
      isDeprecated: false,
      hasFormula: false,
      foreignKeyTableId: this._foreignKeyTableId,
    };
  }

  get rowId() {
    return 'row-1';
  }

  get value() {
    return this._value;
  }

  get displayValue(): string {
    const val = this._value;
    if (val === null || val === undefined) {
      return '';
    }
    if (typeof val === 'boolean') {
      return String(val);
    }
    if (typeof val === 'number') {
      return String(val);
    }
    if (typeof val === 'string') {
      return val;
    }
    if (Array.isArray(val)) {
      return `[${val.length}]`;
    }
    if (typeof val === 'object') {
      return '{...}';
    }
    return '';
  }

  get isReadOnly() {
    return this._isReadOnly;
  }

  get isEditable() {
    return !this._isReadOnly;
  }

  get isFocused() {
    return this._isFocused;
  }

  get isEditing() {
    return this._isEditing;
  }

  get foreignKeyTableId() {
    return this._foreignKeyTableId;
  }

  focus() {
    this._isFocused = true;
  }

  startEdit() {
    if (!this.isEditable) {
      return;
    }
    this._isFocused = true;
    this._isEditing = true;
  }

  commitEdit(newValue: unknown) {
    this._value = newValue;
    this._isEditing = false;
  }

  cancelEdit() {
    this._isEditing = false;
  }

  blur() {
    this._isFocused = false;
    this._isEditing = false;
  }
}

const mockSearchForeignKey: SearchForeignKeySearchFn = (
  _tableId: string,
  search: string,
) => {
  const allIds = ['row-1', 'row-2', 'row-3', 'row-4', 'row-5'];
  const filtered = search ? allIds.filter((id) => id.includes(search)) : allIds;
  return Promise.resolve({ ids: filtered, hasMore: false });
};

interface StoryWrapperProps {
  field: string;
  fieldType: FilterFieldType;
  initialValue: unknown;
  isReadOnly?: boolean;
  foreignKeyTableId?: string;
}

const StoryWrapper = observer(
  ({
    field,
    fieldType,
    initialValue,
    isReadOnly = false,
    foreignKeyTableId,
  }: StoryWrapperProps) => {
    const [model] = useState(
      () =>
        new MockCellVM(
          field,
          fieldType,
          initialValue,
          isReadOnly,
          foreignKeyTableId,
        ),
    );

    return (
      <Box width="200px" borderWidth="1px" borderColor="gray.200">
        <CellRenderer
          cell={model as any}
          onSearchForeignKey={mockSearchForeignKey}
        />
      </Box>
    );
  },
);

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/CellRenderer',
  decorators: [(Story) => <Story />],
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const StringCell: Story = {
  args: {
    field: 'name',
    fieldType: FilterFieldType.String,
    initialValue: 'Hello World',
  },
};

export const NumberCell: Story = {
  args: {
    field: 'age',
    fieldType: FilterFieldType.Number,
    initialValue: 42,
  },
};

export const BooleanTrue: Story = {
  args: {
    field: 'active',
    fieldType: FilterFieldType.Boolean,
    initialValue: true,
  },
};

export const BooleanFalse: Story = {
  args: {
    field: 'active',
    fieldType: FilterFieldType.Boolean,
    initialValue: false,
  },
};

export const ForeignKeyCell: Story = {
  args: {
    field: 'ref',
    fieldType: FilterFieldType.ForeignKey,
    initialValue: 'row-123',
    foreignKeyTableId: 'users',
  },
};

export const ForeignKeyCellEmpty: Story = {
  args: {
    field: 'ref',
    fieldType: FilterFieldType.ForeignKey,
    initialValue: '',
    foreignKeyTableId: 'users',
  },
};

export const FileCell: Story = {
  args: {
    field: 'avatar',
    fieldType: FilterFieldType.File,
    initialValue: 'photo.jpg',
    isReadOnly: true,
  },
};

export const ReadonlyObjectCell: Story = {
  args: {
    field: 'data',
    fieldType: FilterFieldType.String,
    initialValue: { key: 'value' },
    isReadOnly: true,
  },
};

export const StringCellEdit: Story = {
  tags: ['test'],
  args: {
    field: 'name',
    fieldType: FilterFieldType.String,
    initialValue: 'Hello World',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByTestId('cell-row-1-name');

    expect(cell).toHaveTextContent('Hello World');

    await userEvent.dblClick(cell);

    const input = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.clear(input);
    await userEvent.type(input, 'New Value');
    input.blur();

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent(
        'New Value',
      );
    });
  },
};

export const NumberCellEdit: Story = {
  tags: ['test'],
  args: {
    field: 'age',
    fieldType: FilterFieldType.Number,
    initialValue: 42,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByTestId('cell-row-1-age');

    expect(cell).toHaveTextContent('42');

    await userEvent.dblClick(cell);

    const input = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="number-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.clear(input);
    await userEvent.type(input, '99');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-age')).toHaveTextContent('99');
    });
  },
};

export const BooleanCellToggle: Story = {
  tags: ['test'],
  args: {
    field: 'active',
    fieldType: FilterFieldType.Boolean,
    initialValue: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByTestId('cell-row-1-active');

    expect(cell).toHaveTextContent('true');

    await userEvent.click(cell);

    await userEvent.dblClick(cell);

    const falseOption = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="boolean-option-false"]',
      ) as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.click(falseOption);

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-active')).toHaveTextContent(
        'false',
      );
    });
  },
};

export const FocusedEscapeBlurs: Story = {
  tags: ['test'],
  args: {
    field: 'name',
    fieldType: FilterFieldType.String,
    initialValue: 'Hello',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByTestId('cell-row-1-name');

    await userEvent.click(cell);

    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '-1');
    });
  },
};

export const EditingEscapeReturnsFocus: Story = {
  tags: ['test'],
  args: {
    field: 'name',
    fieldType: FilterFieldType.String,
    initialValue: 'Hello',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByTestId('cell-row-1-name');

    await userEvent.dblClick(cell);

    const input = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.type(input, ' World');
    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="string-cell-input"]'),
      ).toBeNull();
    });

    expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('Hello');

    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '-1');
    });
  },
};

export const FocusedEnterStartsEdit: Story = {
  tags: ['test'],
  args: {
    field: 'name',
    fieldType: FilterFieldType.String,
    initialValue: 'Hello',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByTestId('cell-row-1-name');

    await userEvent.click(cell);

    await userEvent.keyboard('{Enter}');

    const input = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.clear(input);
    await userEvent.type(input, 'Updated');
    input.blur();

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent(
        'Updated',
      );
    });
  },
};

export const FocusedTypingStartsEdit: Story = {
  tags: ['test'],
  args: {
    field: 'name',
    fieldType: FilterFieldType.String,
    initialValue: 'Hello',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByTestId('cell-row-1-name');

    await userEvent.click(cell);

    await userEvent.keyboard('X');

    const input = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });

    expect(input.value).toBe('HelloX');

    input.blur();

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('HelloX');
    });
  },
};
