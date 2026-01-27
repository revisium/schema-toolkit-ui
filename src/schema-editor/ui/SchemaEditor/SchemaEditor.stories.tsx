import type { Meta, StoryObj } from '@storybook/react';
import { useState, useCallback } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { SchemaEditor } from './SchemaEditor';
import { SchemaEditorVM } from '../../vm/SchemaEditorVM';
import type { JsonObjectSchema } from '../../model';

const meta = {
  title: 'SchemaEditor/SchemaEditor',
  component: SchemaEditor,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SchemaEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// Empty schema for creating new table
const emptySchema: JsonObjectSchema = {
  type: 'object',
  properties: {},
  additionalProperties: false,
  required: [],
};

// Simple schema with basic fields
const simpleSchema: JsonObjectSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', default: '' },
    description: { type: 'string', default: '' },
    price: { type: 'number', default: 0 },
    inStock: { type: 'boolean', default: true },
  },
  additionalProperties: false,
  required: ['title', 'description', 'price', 'inStock'],
};

// Complex schema with nested objects and arrays
const complexSchema: JsonObjectSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', default: '' },
    email: { type: 'string', default: '' },
    age: { type: 'number', default: 0 },
    isActive: { type: 'boolean', default: true },
    address: {
      type: 'object',
      properties: {
        street: { type: 'string', default: '' },
        city: { type: 'string', default: '' },
        zipCode: { type: 'string', default: '' },
        country: { type: 'string', default: '' },
      },
      additionalProperties: false,
      required: ['street', 'city', 'zipCode', 'country'],
    },
    tags: {
      type: 'array',
      items: { type: 'string', default: '' },
      default: [],
    },
    contacts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', default: '' },
          value: { type: 'string', default: '' },
        },
        additionalProperties: false,
        required: ['type', 'value'],
      },
      default: [],
    },
  },
  additionalProperties: false,
  required: ['name', 'email', 'age', 'isActive', 'address', 'tags', 'contacts'],
};

// Schema with formulas
const schemaWithFormulas: JsonObjectSchema = {
  type: 'object',
  properties: {
    price: { type: 'number', default: 0 },
    quantity: { type: 'number', default: 1 },
    discount: { type: 'number', default: 0 },
    subtotal: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'price * quantity' },
    },
    total: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': {
        version: 1,
        expression: 'subtotal - (subtotal * discount / 100)',
      },
    },
  },
  additionalProperties: false,
  required: ['price', 'quantity', 'discount', 'subtotal', 'total'],
} as JsonObjectSchema;

// Schema with foreign keys
const schemaWithForeignKeys: JsonObjectSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', default: '' },
    categoryId: { type: 'string', default: '', 'x-fk': 'categories' },
    authorId: { type: 'string', default: '', 'x-fk': 'authors' },
    status: { type: 'string', default: 'draft' },
  },
  additionalProperties: false,
  required: ['title', 'categoryId', 'authorId', 'status'],
} as JsonObjectSchema;

// Schema with system refs (File, timestamps)
const schemaWithRefs: JsonObjectSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', default: '' },
    image: { $ref: 'File' },
    createdAt: { $ref: 'RowCreatedAt' },
    updatedAt: { $ref: 'RowUpdatedAt' },
  },
  additionalProperties: false,
  required: ['title', 'image', 'createdAt', 'updatedAt'],
} as JsonObjectSchema;

// Interactive wrapper component
const InteractiveSchemaEditor = ({
  initialSchema,
  mode,
  tableId = 'test-table',
  hint,
}: {
  initialSchema: JsonObjectSchema;
  mode: 'creating' | 'updating';
  tableId?: string;
  hint?: string;
}) => {
  const [viewModel] = useState(
    () => new SchemaEditorVM(initialSchema, { tableId }),
  );

  const handleApprove = useCallback(async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Patches:', viewModel.getPatches());
    console.log('Schema:', viewModel.getPlainSchema());
  }, [viewModel]);

  const handleCancel = useCallback(() => {
    console.log('Cancel clicked');
  }, []);

  const handleSelectForeignKey = useCallback(() => {
    console.log('Select foreign key clicked');
  }, []);

  return (
    <Box h="100vh" bg="gray.50">
      {hint && (
        <Box p={3} bg="blue.50" borderBottom="1px solid" borderColor="blue.100">
          <Text fontSize="sm" color="blue.700">
            💡 {hint}
          </Text>
        </Box>
      )}
      <Box p={4} bg="white" m={4} borderRadius="md" boxShadow="sm">
        <SchemaEditor
          viewModel={viewModel}
          mode={mode}
          onApprove={handleApprove}
          onCancel={handleCancel}
          onSelectForeignKey={handleSelectForeignKey}
        />
      </Box>
    </Box>
  );
};

// ============ STORIES ============

export const CreateNewTable: Story = {
  render: () => (
    <InteractiveSchemaEditor
      initialSchema={emptySchema}
      mode="creating"
      tableId="new-table"
      hint="Add fields via the + button, then click 'Create Table' to open the creation dialog."
    />
  ),
};

export const UpdateSimpleSchema: Story = {
  render: () => (
    <InteractiveSchemaEditor
      initialSchema={simpleSchema}
      mode="updating"
      tableId="products"
      hint="Modify fields (rename, delete, add new), then click 'Apply Changes' to see the changes diff dialog."
    />
  ),
};

export const UpdateComplexSchema: Story = {
  render: () => (
    <InteractiveSchemaEditor
      initialSchema={complexSchema}
      mode="updating"
      tableId="users"
      hint="Complex schema with nested objects and arrays. Expand/collapse nodes, edit nested fields."
    />
  ),
};

export const SchemaWithFormulas: Story = {
  render: () => (
    <InteractiveSchemaEditor
      initialSchema={schemaWithFormulas}
      mode="updating"
      tableId="orders"
      hint="Schema with formulas. Fields subtotal and total are computed. Try renaming price - formulas should update automatically."
    />
  ),
};

export const SchemaWithForeignKeys: Story = {
  render: () => (
    <InteractiveSchemaEditor
      initialSchema={schemaWithForeignKeys}
      mode="updating"
      tableId="posts"
      hint="Schema with foreign key references (categoryId → categories, authorId → authors)."
    />
  ),
};

export const SchemaWithSystemRefs: Story = {
  render: () => (
    <InteractiveSchemaEditor
      initialSchema={schemaWithRefs}
      mode="updating"
      tableId="media"
      hint="Schema with system refs: File (file uploads), RowCreatedAt/RowUpdatedAt (automatic timestamps)."
    />
  ),
};
