import { useState, useCallback, useRef } from 'react';
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
  const foreignKeyResolverRef = useRef<{
    resolve: (value: string | null) => void;
  } | null>(null);
  const [isForeignKeyDialogOpen, setIsForeignKeyDialogOpen] = useState(false);

  const [viewModel] = useState(() => {
    const vm = new SchemaEditorVM(initialSchema, {
      tableId,
      mode,
      collapseComplexSchemas: true,
      onApprove: async () => {
        if (vm.mode === 'creating') {
          onCreateTable({
            tableId: vm.tableId,
            schema: vm.getPlainSchema(),
          });
        } else {
          onApplyChanges({
            tableId: vm.tableId,
            initialTableId: vm.initialTableId,
            isTableIdChanged: vm.isTableIdChanged,
            patches: vm.getPatches(),
            jsonPatches: vm.getJsonPatches(),
          });
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      },
      onCancel,
      onSelectForeignKey: () => {
        return new Promise<string | null>((resolve) => {
          foreignKeyResolverRef.current = { resolve };
          setIsForeignKeyDialogOpen(true);
        });
      },
    });
    setupViewModel?.(vm);
    return vm;
  });

  const handleTableSelect = useCallback((selectedTableId: string) => {
    foreignKeyResolverRef.current?.resolve(selectedTableId);
    foreignKeyResolverRef.current = null;
    setIsForeignKeyDialogOpen(false);
  }, []);

  const handleDialogClose = useCallback(() => {
    foreignKeyResolverRef.current?.resolve(null);
    foreignKeyResolverRef.current = null;
    setIsForeignKeyDialogOpen(false);
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
        <SchemaEditor model={viewModel} />
      </Box>

      <DialogRoot
        open={isForeignKeyDialogOpen}
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
