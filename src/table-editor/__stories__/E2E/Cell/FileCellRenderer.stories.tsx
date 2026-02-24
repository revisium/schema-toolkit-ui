import { useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import type { Meta, StoryObj } from '@storybook/react';
import { observer } from 'mobx-react-lite';
import type { RowModel } from '@revisium/schema-toolkit';
import {
  createTableModel,
  fileSchema,
  SystemSchemaIds,
} from '@revisium/schema-toolkit';
import type { JsonSchema } from '@revisium/schema-toolkit';
import { expect, within, waitFor, userEvent, fn } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import { wrapDataSchema } from '../../../TableEditor/model/SchemaContext.js';
import type { ColumnSpec } from '../../../Columns/model/types.js';
import { FilterFieldType } from '../../../shared/field-types.js';
import { CellFSM } from '../../../Table/model/CellFSM.js';
import { CellVM } from '../../../Table/model/CellVM.js';
import { CellRenderer } from '../../../Table/ui/Cell/CellRenderer.js';

ensureReactivityProvider();

function createColumn(
  field: string,
  fieldType: FilterFieldType,
  overrides?: Partial<ColumnSpec>,
): ColumnSpec {
  return {
    field,
    label: field.replace(/^data\./, ''),
    fieldType,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
    ...overrides,
  };
}

const FILE_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', default: '' },
    avatar: { $ref: SystemSchemaIds.File },
  },
  additionalProperties: false,
  required: ['name', 'avatar'],
} as unknown as JsonSchema;

const REF_SCHEMAS: Record<string, JsonSchema> = {
  [SystemSchemaIds.File]: fileSchema,
};

const mockUploadFile = fn().mockName('onUploadFile');
const mockOpenFile = fn().mockName('onOpenFile');

interface FileCellTestState {
  cellFSM: CellFSM;
  fileCell: CellVM;
  nameCell: CellVM;
}

function createFileCellState(
  fileData: Record<string, unknown>,
): FileCellTestState {
  const cellFSM = new CellFSM();
  const tableModel = createTableModel({
    tableId: 'file-test',
    schema: wrapDataSchema(FILE_SCHEMA) as any,
    rows: [
      { rowId: 'row-1', data: { data: { name: 'Alice', avatar: fileData } } },
    ],
    refSchemas: REF_SCHEMAS,
  });
  const rowModel = tableModel.rows[0] as RowModel;

  const nameColumn = createColumn('data.name', FilterFieldType.String);
  const avatarColumn = createColumn('data.avatar', FilterFieldType.File);

  const nameCell = new CellVM(rowModel, nameColumn, 'row-1', cellFSM);
  const fileCell = new CellVM(rowModel, avatarColumn, 'row-1', cellFSM);

  cellFSM.setNavigationContext(['data.name', 'data.avatar'], ['row-1']);

  return { cellFSM, fileCell, nameCell };
}

const UPLOADED_FILE_DATA = {
  status: 'uploaded',
  fileId: 'file-1',
  url: 'https://picsum.photos/200',
  fileName: 'avatar.png',
  hash: 'abc123',
  extension: '.png',
  mimeType: 'image/png',
  size: 1024,
  width: 200,
  height: 200,
};

const READY_FILE_DATA = {
  status: 'ready',
  fileId: 'file-2',
  url: '',
  fileName: '',
  hash: '',
  extension: '',
  mimeType: '',
  size: 0,
  width: 0,
  height: 0,
};

const UploadedFileWrapper = observer(() => {
  const [state] = useState(() => createFileCellState(UPLOADED_FILE_DATA));

  return (
    <Flex direction="column" gap="8px">
      <Box width="200px" data-testid="name-cell-wrapper">
        <CellRenderer cell={state.nameCell} />
      </Box>
      <Box width="250px" data-testid="file-cell-wrapper">
        <table>
          <thead>
            <tr>
              <th>Avatar</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <CellRenderer
                  cell={state.fileCell}
                  onUploadFile={mockUploadFile}
                  onOpenFile={mockOpenFile}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </Box>
    </Flex>
  );
});

const ReadyFileWrapper = observer(() => {
  const [state] = useState(() => createFileCellState(READY_FILE_DATA));

  return (
    <Box width="250px" data-testid="file-cell-wrapper">
      <table>
        <thead>
          <tr>
            <th>Avatar</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <CellRenderer
                cell={state.fileCell}
                onUploadFile={mockUploadFile}
                onOpenFile={mockOpenFile}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </Box>
  );
});

const meta: Meta = {
  title: 'TableEditor/E2E/Cell/FileCellRenderer',
  decorators: [(Story) => <Story />],
};
export default meta;
type Story = StoryObj;

export const DisplaysFileName: Story = {
  tags: ['test'],
  render: () => <UploadedFileWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const fileCell = canvas.getByTestId('cell-row-1-data.avatar');
    await waitFor(() => {
      expect(fileCell).toHaveTextContent('avatar.png');
    });
  },
};

export const EditFileName: Story = {
  tags: ['test'],
  render: () => <UploadedFileWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const fileCell = canvas.getByTestId('cell-row-1-data.avatar');
    await waitFor(() => {
      expect(fileCell).toHaveTextContent('avatar.png');
    });

    await userEvent.dblClick(fileCell);

    const input = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="file-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });

    expect(input.value).toBe('avatar.png');

    await userEvent.clear(input);
    await userEvent.type(input, 'new-avatar.png');
    input.blur();

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.avatar')).toHaveTextContent(
        'new-avatar.png',
      );
    });
  },
};

export const EditFileNameViaEnter: Story = {
  tags: ['test'],
  render: () => <UploadedFileWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const fileCell = canvas.getByTestId('cell-row-1-data.avatar');
    await userEvent.click(fileCell);

    await waitFor(() => {
      expect(fileCell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.keyboard('{Enter}');

    const input = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="file-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.clear(input);
    await userEvent.type(input, 'renamed.png');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.avatar')).toHaveTextContent(
        'renamed.png',
      );
    });
  },
};

export const EditFileNameCancel: Story = {
  tags: ['test'],
  render: () => <UploadedFileWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const fileCell = canvas.getByTestId('cell-row-1-data.avatar');
    await userEvent.dblClick(fileCell);

    const input = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="file-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.clear(input);
    await userEvent.type(input, 'should-not-save.png');
    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="file-cell-input"]'),
      ).toBeNull();
    });

    expect(canvas.getByTestId('cell-row-1-data.avatar')).toHaveTextContent(
      'avatar.png',
    );
  },
};

export const OpenFileCallback: Story = {
  tags: ['test'],
  render: () => <UploadedFileWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    mockOpenFile.mockClear();

    const row = canvas.getByTestId('file-cell-wrapper').querySelector('tr');
    expect(row).toBeTruthy();

    await userEvent.hover(row!);

    const openBtn = await waitFor(() => {
      const el = canvas.getByTestId('cell-file-open-row-1-data.avatar');
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.click(openBtn);

    await waitFor(() => {
      expect(mockOpenFile).toHaveBeenCalledWith('https://picsum.photos/200');
    });
  },
};

export const ReadyFileShowsUploadButton: Story = {
  tags: ['test'],
  render: () => <ReadyFileWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const row = canvas.getByTestId('file-cell-wrapper').querySelector('tr');
    expect(row).toBeTruthy();

    await userEvent.hover(row!);

    await waitFor(() => {
      const uploadBtn = canvas.getByTestId(
        'cell-file-upload-row-1-data.avatar',
      );
      expect(uploadBtn).toBeTruthy();
    });
  },
};

export const TypeCharOpensEdit: Story = {
  tags: ['test'],
  render: () => <UploadedFileWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const fileCell = canvas.getByTestId('cell-row-1-data.avatar');
    await userEvent.click(fileCell);

    await waitFor(() => {
      expect(fileCell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.keyboard('X');

    const input = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="file-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });

    expect(input.value).toBe('X');
    input.blur();

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.avatar')).toHaveTextContent(
        'X',
      );
    });
  },
};
