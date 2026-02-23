import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, fn } from 'storybook/test';
import { fileSchema, SystemSchemaIds } from '@revisium/schema-toolkit';
import { StoryWrapper, baseMeta } from '../shared';
import { fileFieldSchema } from '../schemas';
import type { RowEditorCallbacks } from '../../../../vm/types';
import type { RowEditorVM } from '../../../../vm/RowEditorVM';

const refSchemas = {
  [SystemSchemaIds.File]: fileSchema,
};

function getTestVM(): RowEditorVM {
  return (window as unknown as Record<string, unknown>).__testVM as RowEditorVM;
}

function getFileChildValue(
  vm: RowEditorVM,
  fileField: string,
  childName: string,
): unknown {
  const root = vm.root;
  if (root.isObject()) {
    const fileNode = root.child(fileField);
    if (fileNode?.isObject()) {
      const child = fileNode.child(childName);
      if (child?.isPrimitive()) {
        return child.value;
      }
    }
  }
  return undefined;
}

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/E2E/FileUpload',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const UploadFileUpdatesTree: Story = {
  args: { onSave: fn(), onChange: fn(), onCancel: fn() },
  render: (args) => {
    const callbacks: RowEditorCallbacks = {
      onUploadFile: ({ fileId }): Promise<Record<string, unknown> | null> => {
        return Promise.resolve({
          status: 'uploaded',
          fileId,
          url: 'https://example.com/avatar.png',
          fileName: 'avatar.png',
          mimeType: 'image/png',
          extension: '.png',
          size: 2048,
          width: 400,
          height: 300,
          hash: 'abc123',
        });
      },
      onOpenFile: () => {},
    };

    return (
      <StoryWrapper
        {...args}
        schema={fileFieldSchema}
        initialValue={{
          name: 'My Document',
          avatar: {
            status: 'ready',
            fileId: 'file-001',
            url: '',
            fileName: '',
            hash: '',
            extension: '',
            mimeType: '',
            size: 0,
            width: 0,
            height: 0,
          },
        }}
        refSchemas={refSchemas}
        callbacks={callbacks}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const vm = getTestVM();

    await waitFor(() => {
      expect(getFileChildValue(vm, 'avatar', 'status')).toBe('ready');
    });

    await waitFor(() => {
      const uploadBtn = canvas.getByTestId('avatar-upload-file');
      expect(uploadBtn).toBeInTheDocument();
    });

    const fileInput = canvas.getByTestId('avatar-file-input');
    const testFile = new File(['test content'], 'avatar.png', {
      type: 'image/png',
    });
    Object.defineProperty(fileInput, 'files', { value: [testFile] });
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(
      () => {
        expect(getFileChildValue(vm, 'avatar', 'status')).toBe('uploaded');
      },
      { timeout: 3000 },
    );

    expect(getFileChildValue(vm, 'avatar', 'url')).toBe(
      'https://example.com/avatar.png',
    );
    expect(getFileChildValue(vm, 'avatar', 'mimeType')).toBe('image/png');
    expect(getFileChildValue(vm, 'avatar', 'size')).toBe(2048);
    expect(getFileChildValue(vm, 'avatar', 'width')).toBe(400);
    expect(getFileChildValue(vm, 'avatar', 'height')).toBe(300);
    expect(getFileChildValue(vm, 'avatar', 'fileName')).toBe('avatar.png');

    expect(vm.isDirty).toBe(true);

    await waitFor(() => {
      const openFileBtn = canvas.getByTestId('avatar-open-file');
      expect(openFileBtn).toBeInTheDocument();
    });
  },
};

export const FileFieldInitialState: Story = {
  args: { onSave: fn(), onChange: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={fileFieldSchema}
      initialValue={{
        name: 'Empty Doc',
        avatar: {
          status: '',
          fileId: '',
          url: '',
          fileName: '',
          hash: '',
          extension: '',
          mimeType: '',
          size: 0,
          width: 0,
          height: 0,
        },
      }}
      refSchemas={refSchemas}
      callbacks={{
        onUploadFile: (_params) => Promise.resolve(null),
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const vm = getTestVM();

    await waitFor(() => {
      expect(getFileChildValue(vm, 'avatar', 'status')).toBe('');
    });

    expect(getFileChildValue(vm, 'avatar', 'url')).toBe('');

    const openFileBtn = canvas.queryByTestId('avatar-open-file');
    expect(openFileBtn).not.toBeInTheDocument();

    const uploadBtn = canvas.queryByTestId('avatar-upload-file');
    expect(uploadBtn).not.toBeInTheDocument();
  },
};
