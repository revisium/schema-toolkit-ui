import type { Meta, StoryObj } from '@storybook/react';
import { StoryWrapper, baseMeta } from './shared';
import { fileFieldSchema } from './schemas';
import { fileSchema, SystemSchemaIds } from '@revisium/schema-toolkit';
import type { RowEditorCallbacks } from '../../../vm/types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const refSchemas = {
  [SystemSchemaIds.File]: fileSchema,
};

const mockCallbacks: RowEditorCallbacks = {
  onUploadFile: async (_fileId: string, file: File) => {
    await delay(500);
    const isImage = file.type.startsWith('image/');
    return {
      status: 'uploaded',
      fileId: _fileId,
      url: `https://picsum.photos/${isImage ? '400/300' : '200'}`,
      fileName: file.name,
      mimeType: file.type,
      extension: '.' + file.name.split('.').pop(),
      size: file.size,
      width: isImage ? 400 : 0,
      height: isImage ? 300 : 0,
      hash: 'mock-hash-' + Date.now(),
    };
  },
  onOpenFile: (url: string) => {
    window.open(url, '_blank');
  },
};

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/File',
};
export default meta;

type Story = StoryObj<typeof StoryWrapper>;

export const Default: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={fileFieldSchema}
      initialValue={{
        name: 'My Document',
        avatar: {
          status: 'uploaded',
          fileId: 'file-123',
          url: 'https://picsum.photos/200',
          fileName: 'avatar.png',
          hash: 'abc123',
          extension: '.png',
          mimeType: 'image/png',
          size: 1024,
          width: 200,
          height: 200,
        },
      }}
      refSchemas={refSchemas}
      callbacks={mockCallbacks}
      hint="File field with uploaded image. Hover the file icon to preview."
    />
  ),
};

export const NoFile: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={fileFieldSchema}
      initialValue={{
        name: 'Empty Document',
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
      callbacks={mockCallbacks}
      hint="File field with no uploaded file. Shows info icon."
    />
  ),
};

export const ReadyToUpload: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={fileFieldSchema}
      initialValue={{
        name: 'Ready Upload',
        avatar: {
          status: 'ready',
          fileId: 'file-456',
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
      callbacks={mockCallbacks}
      hint="File field ready for upload. Click the upload icon to select a file."
    />
  ),
};

export const NonImageFile: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={fileFieldSchema}
      initialValue={{
        name: 'PDF Document',
        avatar: {
          status: 'uploaded',
          fileId: 'file-789',
          url: 'https://example.com/doc.pdf',
          fileName: 'document.pdf',
          hash: 'def456',
          extension: '.pdf',
          mimeType: 'application/pdf',
          size: 5120,
          width: 0,
          height: 0,
        },
      }}
      refSchemas={refSchemas}
      callbacks={mockCallbacks}
      hint="Non-image file. File icon without hover preview."
    />
  ),
};

export const ReadOnly: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={fileFieldSchema}
      initialValue={{
        name: 'Locked Document',
        avatar: {
          status: 'uploaded',
          fileId: 'file-readonly',
          url: 'https://picsum.photos/200',
          fileName: 'photo.jpg',
          hash: 'ghi789',
          extension: '.jpg',
          mimeType: 'image/jpeg',
          size: 2048,
          width: 200,
          height: 200,
        },
      }}
      refSchemas={refSchemas}
      callbacks={mockCallbacks}
      mode="reading"
      hint="Read-only file field. No upload button visible."
    />
  ),
};
