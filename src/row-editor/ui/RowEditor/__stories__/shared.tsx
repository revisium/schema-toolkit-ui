import { useState, useEffect } from 'react';
import { Box, Text, HStack, Button, SegmentGroup } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { JsonSchema, JsonValuePatch } from '@revisium/schema-toolkit';
import { RowEditor } from '../RowEditor';
import { RowEditorVM, RowEditorMode } from '../../../vm/RowEditorVM';
import type { RowEditorCallbacks } from '../../../vm/types';
import { JsonCard } from '../../../../components/JsonCard';

type ViewMode = 'Tree' | 'JSON' | 'Schema';

export interface StoryWrapperProps {
  schema: JsonSchema;
  initialValue?: unknown;
  mode?: RowEditorMode;
  hint?: string;
  onSave?: (
    rowId: string,
    value: unknown,
    patches: readonly JsonValuePatch[],
  ) => void;
  onChange?: (patches: readonly JsonValuePatch[]) => void;
  onCancel?: () => void;
  callbacks?: RowEditorCallbacks;
  refSchemas?: Record<string, JsonSchema>;
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
    callbacks,
    refSchemas,
  }: StoryWrapperProps) => {
    const [viewModel] = useState(
      () =>
        new RowEditorVM(schema, initialValue, {
          mode,
          onChange,
          onSave,
          onCancel,
          callbacks,
          refSchemas,
        }),
    );
    const [viewMode, setViewMode] = useState<ViewMode>('Tree');

    useEffect(() => {
      (window as unknown as Record<string, unknown>).__testVM = viewModel;
    }, [viewModel]);

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
          <HStack mb={4}>
            <SegmentGroup.Root
              size="sm"
              value={viewMode}
              onValueChange={(details) =>
                setViewMode(details.value as ViewMode)
              }
            >
              <SegmentGroup.Indicator />
              <SegmentGroup.Items items={['Tree', 'JSON', 'Schema']} />
            </SegmentGroup.Root>
          </HStack>

          {viewMode === 'Tree' && (
            <>
              <RowEditor viewModel={viewModel} />

              {mode !== 'reading' && (
                <HStack
                  mt={4}
                  pt={4}
                  borderTop="1px solid"
                  borderColor="gray.200"
                >
                  <Button
                    colorPalette="blue"
                    onClick={viewModel.save}
                    disabled={!viewModel.isDirty}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={viewModel.revert}
                    disabled={!viewModel.isDirty}
                  >
                    Revert
                  </Button>
                  <Button variant="ghost" onClick={viewModel.cancel}>
                    Cancel
                  </Button>
                </HStack>
              )}
            </>
          )}

          {viewMode === 'JSON' && (
            <Box
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              overflow="hidden"
            >
              <JsonCard
                data={
                  viewModel.getValue() as Parameters<typeof JsonCard>[0]['data']
                }
                readonly
              />
            </Box>
          )}

          {viewMode === 'Schema' && (
            <Box
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              overflow="hidden"
            >
              <JsonCard
                data={schema as Parameters<typeof JsonCard>[0]['data']}
                readonly
              />
            </Box>
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
