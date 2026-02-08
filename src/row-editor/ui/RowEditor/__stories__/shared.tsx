import { useState, useEffect } from 'react';
import { Box, Text, HStack, Button } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { JsonSchema, JsonValuePatch } from '@revisium/schema-toolkit';
import { RowEditor } from '../RowEditor';
import { RowEditorVM, RowEditorMode } from '../../../vm/RowEditorVM';

export interface StoryWrapperProps {
  schema: JsonSchema;
  initialValue?: unknown;
  mode?: RowEditorMode;
  hint?: string;
  onSave?: (value: unknown, patches: readonly JsonValuePatch[]) => void;
  onChange?: (patches: readonly JsonValuePatch[]) => void;
  onCancel?: () => void;
}

export const StoryWrapper = observer(
  ({
    schema,
    initialValue,
    mode = 'editing',
    hint,
    onSave,
    onChange,
    onCancel,
  }: StoryWrapperProps) => {
    const [viewModel] = useState(
      () => new RowEditorVM(schema, initialValue, { mode }),
    );

    useEffect(() => {
      (window as unknown as Record<string, unknown>).__testVM = viewModel;
    }, [viewModel]);

    const handleSave = () => {
      const value = viewModel.getValue();
      const patches = viewModel.patches;
      viewModel.commit();
      onSave?.(value, patches);
    };

    const handleRevert = () => {
      viewModel.revert();
    };

    return (
      <Box h="100vh" bg="gray.50">
        {hint && (
          <Box
            p={3}
            bg="blue.50"
            borderBottom="1px solid"
            borderColor="blue.100"
          >
            <Text fontSize="sm" color="blue.700">
              {hint}
            </Text>
          </Box>
        )}
        <Box p={4} pl={8} bg="white" m={4} borderRadius="md" boxShadow="sm">
          <RowEditor viewModel={viewModel} onChange={onChange} />

          {mode !== 'reading' && (
            <HStack mt={4} pt={4} borderTop="1px solid" borderColor="gray.200">
              <Button
                colorPalette="blue"
                onClick={handleSave}
                disabled={!viewModel.isDirty}
              >
                Save
              </Button>
              <Button
                variant="outline"
                onClick={handleRevert}
                disabled={!viewModel.isDirty}
              >
                Revert
              </Button>
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            </HStack>
          )}
        </Box>
      </Box>
    );
  },
);

export const baseMeta = {
  component: RowEditor,
  parameters: {
    layout: 'fullscreen' as const,
  },
  argTypes: {
    onSave: { action: 'onSave' },
    onChange: { action: 'onChange' },
    onCancel: { action: 'onCancel' },
  },
};
