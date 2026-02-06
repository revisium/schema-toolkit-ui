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
import type { JsonObjectSchema } from '@revisium/schema-toolkit';
import { CreatingSchemaEditor } from '../CreatingSchemaEditor';
import { UpdatingSchemaEditor } from '../UpdatingSchemaEditor';
import { CreatingEditorVM } from '../../model/vm/CreatingEditorVM';
import { UpdatingEditorVM } from '../../model/vm/UpdatingEditorVM';

export const AVAILABLE_TABLES = [
  'users',
  'categories',
  'authors',
  'products',
  'orders',
  'tags',
];

export interface CreatingStoryWrapperProps {
  initialSchema: JsonObjectSchema;
  tableId?: string;
  hint?: string;
  onCreateTable: (data: { tableId: string; schema: JsonObjectSchema }) => void;
  onCancel: () => void;
  setupStore?: (vm: CreatingEditorVM) => void;
}

export const CreatingStoryWrapper = ({
  initialSchema,
  tableId = 'new-table',
  hint,
  onCreateTable,
  onCancel,
  setupStore,
}: CreatingStoryWrapperProps) => {
  const foreignKeyResolverRef = useRef<{
    resolve: (value: string | null) => void;
  } | null>(null);
  const [isForeignKeyDialogOpen, setIsForeignKeyDialogOpen] = useState(false);

  const [vm] = useState(() => {
    const v = new CreatingEditorVM(initialSchema, {
      tableId,
      collapseComplexSchemas: true,
      onApprove: async () => {
        onCreateTable({
          tableId: v.tree.rootAccessor.label.name,
          schema: v.getPlainSchema(),
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return true;
      },
      onCancel,
      onSelectForeignKey: () => {
        return new Promise<string | null>((resolve) => {
          foreignKeyResolverRef.current = { resolve };
          setIsForeignKeyDialogOpen(true);
        });
      },
    });
    setupStore?.(v);
    return v;
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
        <CreatingSchemaEditor vm={vm} />
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

export interface UpdatingStoryWrapperProps {
  initialSchema: JsonObjectSchema;
  tableId?: string;
  hint?: string;
  onApplyChanges: (data: {
    tableId: string;
    initialTableId: string;
    isTableIdChanged: boolean;
    patches: unknown[];
    jsonPatches: unknown[];
  }) => void;
  onCancel: () => void;
  setupStore?: (vm: UpdatingEditorVM) => void;
}

export const UpdatingStoryWrapper = ({
  initialSchema,
  tableId = 'test-table',
  hint,
  onApplyChanges,
  onCancel,
  setupStore,
}: UpdatingStoryWrapperProps) => {
  const foreignKeyResolverRef = useRef<{
    resolve: (value: string | null) => void;
  } | null>(null);
  const [isForeignKeyDialogOpen, setIsForeignKeyDialogOpen] = useState(false);

  const [vm] = useState(() => {
    const v = new UpdatingEditorVM(initialSchema, {
      tableId,
      collapseComplexSchemas: true,
      onApprove: async () => {
        onApplyChanges({
          tableId: v.tree.rootAccessor.label.name,
          initialTableId: tableId,
          isTableIdChanged: v.tree.rootAccessor.label.name !== tableId,
          patches: v.getPatches(),
          jsonPatches: v.getJsonPatches(),
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return true;
      },
      onCancel,
      onSelectForeignKey: () => {
        return new Promise<string | null>((resolve) => {
          foreignKeyResolverRef.current = { resolve };
          setIsForeignKeyDialogOpen(true);
        });
      },
    });
    setupStore?.(v);
    return v;
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
        <UpdatingSchemaEditor vm={vm} />
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

export const creatingBaseMeta = {
  component: CreatingSchemaEditor,
  title: 'V3/SchemaEditor/Creating',
  parameters: {
    layout: 'fullscreen' as const,
  },
  argTypes: {
    onCreateTable: { action: 'onCreateTable' },
    onCancel: { action: 'onCancel' },
  },
};

export const updatingBaseMeta = {
  component: UpdatingSchemaEditor,
  title: 'V3/SchemaEditor/Updating',
  parameters: {
    layout: 'fullscreen' as const,
  },
  argTypes: {
    onApplyChanges: { action: 'onApplyChanges' },
    onCancel: { action: 'onCancel' },
  },
};
