import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import {
  obj,
  str,
  num,
  bool,
  numFormula,
  boolFormula,
} from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../../lib/initReactivity.js';
import {
  createTableEditorStoryState,
  type TableEditorStoryState,
} from '../../__stories__/helpers.js';
import type {
  TableEditorCallbacks,
  TableEditorBreadcrumb,
} from '../model/TableEditorCore.js';
import { TableEditor } from '../ui/TableEditor.js';
import {
  TABLE_SCHEMA,
  MOCK_ROWS_DATA,
  MANY_COLUMNS_SCHEMA,
  MANY_COLUMNS_ROWS,
  FILE_TABLE_SCHEMA,
  FILE_MOCK_ROWS_DATA,
  FILE_REF_SCHEMAS,
  SYSTEM_FIELDS_SCHEMA,
  SYSTEM_FIELDS_ROWS,
  generateManyRows,
} from './tableEditorTestData.js';

ensureReactivityProvider();

const STORY_BREADCRUMBS: TableEditorBreadcrumb[] = [
  { label: 'Database', dataTestId: 'breadcrumb-0' },
  { label: 'invoices', dataTestId: 'breadcrumb-1' },
];

export interface StoryWrapperProps {
  state: TableEditorStoryState;
}

export const StoryWrapper = observer(({ state }: StoryWrapperProps) => {
  return (
    <Box width="800px" height="500px">
      <TableEditor viewModel={state.core} />
    </Box>
  );
});

function spyOnDataSource(
  ds: import('../model/MockDataSource.js').MockDataSource,
) {
  const fetchMetadataSpy = fn().mockName('dataSource.fetchMetadata');
  const fetchRowsSpy = fn().mockName('dataSource.fetchRows');
  const patchCellsSpy = fn().mockName('dataSource.patchCells');
  const deleteRowsSpy = fn().mockName('dataSource.deleteRows');
  const saveViewSpy = fn().mockName('dataSource.saveView');

  const origFetchMetadata = ds.fetchMetadata.bind(ds);
  const origFetchRows = ds.fetchRows.bind(ds);
  const origPatchCells = ds.patchCells.bind(ds);
  const origDeleteRows = ds.deleteRows.bind(ds);
  const origSaveView = ds.saveView.bind(ds);

  ds.fetchMetadata = (...args: Parameters<typeof ds.fetchMetadata>) => {
    fetchMetadataSpy(...args);
    return origFetchMetadata(...args);
  };
  ds.fetchRows = (...args: Parameters<typeof ds.fetchRows>) => {
    fetchRowsSpy(...args);
    return origFetchRows(...args);
  };
  ds.patchCells = (...args: Parameters<typeof ds.patchCells>) => {
    patchCellsSpy(...args);
    return origPatchCells(...args);
  };
  ds.deleteRows = (...args: Parameters<typeof ds.deleteRows>) => {
    deleteRowsSpy(...args);
    return origDeleteRows(...args);
  };
  ds.saveView = (...args: Parameters<typeof ds.saveView>) => {
    saveViewSpy(...args);
    return origSaveView(...args);
  };
}

const defaultCallbacks: TableEditorCallbacks = {
  onBreadcrumbClick: fn().mockName('onBreadcrumbClick'),
  onCreateRow: fn().mockName('onCreateRow'),
  onOpenRow: fn().mockName('onOpenRow'),
  onDuplicateRow: fn().mockName('onDuplicateRow'),
  onCopyPath: fn().mockName('onCopyPath'),
};

const DefaultWrapper = observer(() => {
  const [state] = useState(() => {
    const s = createTableEditorStoryState({
      dataSchema: MANY_COLUMNS_SCHEMA,
      rowsData: MANY_COLUMNS_ROWS,
      breadcrumbs: STORY_BREADCRUMBS,
      callbacks: defaultCallbacks,
    });
    spyOnDataSource(s.dataSource);
    return s;
  });

  return <StoryWrapper state={state} />;
});

const meta: Meta<typeof DefaultWrapper> = {
  component: DefaultWrapper as any,
  title: 'TableEditor/TableEditor',
  excludeStories: ['StoryWrapper'],
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof DefaultWrapper>;

export const Default: Story = {};

export const EmptyTable: Story = {
  render: () => {
    const Wrapper = observer(() => {
      const [state] = useState(() =>
        createTableEditorStoryState({
          dataSchema: TABLE_SCHEMA,
          rowsData: [],
          breadcrumbs: STORY_BREADCRUMBS,
          callbacks: defaultCallbacks,
        }),
      );

      return <StoryWrapper state={state} />;
    });

    return <Wrapper />;
  },
};

const FORMULA_SCHEMA = obj({
  item: str(),
  price: num(),
  quantity: num(),
  total: numFormula('price * quantity'),
  expensive: boolFormula('total > 100'),
});

const FORMULA_ROWS = [
  { item: 'Laptop', price: 999, quantity: 2 },
  { item: 'Mouse', price: 25, quantity: 3 },
  { item: 'Monitor', price: 450, quantity: 1 },
];

export const WithFormulas: Story = {
  render: () => {
    const Wrapper = observer(() => {
      const [state] = useState(() =>
        createTableEditorStoryState({
          dataSchema: FORMULA_SCHEMA,
          rowsData: FORMULA_ROWS,
          breadcrumbs: STORY_BREADCRUMBS,
          callbacks: defaultCallbacks,
        }),
      );

      return <StoryWrapper state={state} />;
    });

    return <Wrapper />;
  },
};

const READONLY_SCHEMA = obj({
  name: str({ readOnly: true }),
  age: num({ readOnly: true }),
  active: bool({ readOnly: true }),
});

export const Readonly: Story = {
  render: () => {
    const Wrapper = observer(() => {
      const [state] = useState(() =>
        createTableEditorStoryState({
          dataSchema: READONLY_SCHEMA,
          rowsData: MOCK_ROWS_DATA,
          readonly: true,
          breadcrumbs: STORY_BREADCRUMBS,
          callbacks: { onOpenRow: fn().mockName('onOpenRow') },
        }),
      );

      return <StoryWrapper state={state} />;
    });

    return <Wrapper />;
  },
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const onUploadFileSpy = fn().mockName('onUploadFile');
const onOpenFileSpy = fn().mockName('onOpenFile');

const fileCallbacks: TableEditorCallbacks = {
  onBreadcrumbClick: fn().mockName('onBreadcrumbClick'),
  onCreateRow: fn().mockName('onCreateRow'),
  onOpenRow: fn().mockName('onOpenRow'),
  onDuplicateRow: fn().mockName('onDuplicateRow'),
  onUploadFile: async ({ rowId, fileId, file }) => {
    onUploadFileSpy({ rowId, fileId, fileName: file.name });
    await delay(500);
    const isImage = file.type.startsWith('image/');
    return {
      status: 'uploaded',
      fileId,
      url: `https://picsum.photos/${isImage ? '400/300' : '200'}`,
      fileName: file.name,
      mimeType: file.type,
      extension: file.name.includes('.')
        ? '.' + file.name.split('.').pop()
        : '',
      size: file.size,
      width: isImage ? 400 : 0,
      height: isImage ? 300 : 0,
      hash: 'mock-hash-' + Date.now(),
    };
  },
  onOpenFile: (url: string) => {
    onOpenFileSpy(url);
    window.open(url, '_blank');
  },
};

export const FileColumns: Story = {
  render: () => {
    const Wrapper = observer(() => {
      const [state] = useState(() =>
        createTableEditorStoryState({
          dataSchema: FILE_TABLE_SCHEMA,
          rowsData: FILE_MOCK_ROWS_DATA,
          breadcrumbs: STORY_BREADCRUMBS,
          callbacks: fileCallbacks,
          refSchemas: FILE_REF_SCHEMAS,
        }),
      );

      return <StoryWrapper state={state} />;
    });

    return <Wrapper />;
  },
};

export const WithSystemColumns: Story = {
  render: () => {
    const Wrapper = observer(() => {
      const [state] = useState(() =>
        createTableEditorStoryState({
          dataSchema: SYSTEM_FIELDS_SCHEMA,
          rowsData: [],
          rows: SYSTEM_FIELDS_ROWS,
          breadcrumbs: STORY_BREADCRUMBS,
          callbacks: defaultCallbacks,
        }),
      );

      return <StoryWrapper state={state} />;
    });

    return <Wrapper />;
  },
};

export const ManyRows: Story = {
  render: () => {
    const Wrapper = observer(() => {
      const [state] = useState(() => {
        const s = createTableEditorStoryState({
          dataSchema: MANY_COLUMNS_SCHEMA,
          rowsData: generateManyRows(1000),
          breadcrumbs: STORY_BREADCRUMBS,
          callbacks: defaultCallbacks,
        });
        spyOnDataSource(s.dataSource);
        return s;
      });

      return <StoryWrapper state={state} />;
    });

    return <Wrapper />;
  },
};
