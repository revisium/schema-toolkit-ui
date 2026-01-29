import { useState, useCallback } from 'react';
import { Box, Text, Button, VStack, Portal } from '@chakra-ui/react';
import {
  DialogBackdrop,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
} from '@chakra-ui/react/dialog';
import { SchemaEditor } from '../SchemaEditor';
import { SchemaEditorVM } from '../../../vm/SchemaEditorVM';
import { ForeignKeyNodeVM } from '../../../vm/ForeignKeyNodeVM';
import type { JsonObjectSchema } from '../../../model';

export const AVAILABLE_TABLES = [
  'users',
  'categories',
  'authors',
  'products',
  'orders',
  'tags',
];

export interface StoryWrapperProps {
  initialSchema: JsonObjectSchema;
  mode: 'creating' | 'updating';
  tableId?: string;
  hint?: string;
  onCreateTable: (data: { tableId: string; schema: JsonObjectSchema }) => void;
  onApplyChanges: (data: {
    tableId: string;
    initialTableId: string;
    isTableIdChanged: boolean;
    patches: unknown[];
    jsonPatches: unknown[];
  }) => void;
  onCancel: () => void;
  setupViewModel?: (vm: SchemaEditorVM) => void;
}

export const StoryWrapper = ({
  initialSchema,
  mode,
  tableId = 'test-table',
  hint,
  onCreateTable,
  onApplyChanges,
  onCancel,
  setupViewModel,
}: StoryWrapperProps) => {
  const [viewModel] = useState(() => {
    const vm = new SchemaEditorVM(initialSchema, { tableId });
    setupViewModel?.(vm);
    return vm;
  });
  const [foreignKeyDialog, setForeignKeyDialog] = useState<{
    isOpen: boolean;
    nodeVM: ForeignKeyNodeVM | null;
  }>({ isOpen: false, nodeVM: null });

  const handleApprove = useCallback(async () => {
    if (mode === 'creating') {
      onCreateTable({
        tableId: viewModel.tableId,
        schema: viewModel.getPlainSchema(),
      });
    } else {
      onApplyChanges({
        tableId: viewModel.tableId,
        initialTableId: viewModel.initialTableId,
        isTableIdChanged: viewModel.isTableIdChanged,
        patches: viewModel.getPatches(),
        jsonPatches: viewModel.getJsonPatches(),
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    viewModel.markAsSaved();
  }, [viewModel, mode, onCreateTable, onApplyChanges]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleSelectForeignKey = useCallback((nodeVM: unknown) => {
    if (nodeVM instanceof ForeignKeyNodeVM) {
      setForeignKeyDialog({ isOpen: true, nodeVM });
    }
  }, []);

  const handleTableSelect = useCallback(
    (selectedTableId: string) => {
      if (foreignKeyDialog.nodeVM) {
        foreignKeyDialog.nodeVM.setForeignKey(selectedTableId);
      }
      setForeignKeyDialog({ isOpen: false, nodeVM: null });
    },
    [foreignKeyDialog.nodeVM],
  );

  const handleDialogClose = useCallback(() => {
    setForeignKeyDialog({ isOpen: false, nodeVM: null });
  }, []);

  return (
    <Box h="100vh" bg="gray.50">
      {hint && (
        <Box p={3} bg="blue.50" borderBottom="1px solid" borderColor="blue.100">
          <Text fontSize="sm" color="blue.700">
            {hint}
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

      <DialogRoot
        open={foreignKeyDialog.isOpen}
        onOpenChange={({ open }: { open: boolean }) =>
          !open && handleDialogClose()
        }
      >
        <Portal>
          <DialogBackdrop />
          <DialogPositioner>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Table</DialogTitle>
              </DialogHeader>
              <DialogBody pb={6}>
                <VStack gap={2} align="stretch">
                  {AVAILABLE_TABLES.map((table) => (
                    <Button
                      key={table}
                      variant="outline"
                      justifyContent="flex-start"
                      onClick={() => handleTableSelect(table)}
                    >
                      {table}
                    </Button>
                  ))}
                </VStack>
              </DialogBody>
            </DialogContent>
          </DialogPositioner>
        </Portal>
      </DialogRoot>
    </Box>
  );
};

export const baseMeta = {
  component: SchemaEditor,
  parameters: {
    layout: 'fullscreen' as const,
  },
  argTypes: {
    onCreateTable: { action: 'onCreateTable' },
    onApplyChanges: { action: 'onApplyChanges' },
    onCancel: { action: 'onCancel' },
  },
};
