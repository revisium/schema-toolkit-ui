import { Box, Button, Portal, SegmentGroup, VStack } from '@chakra-ui/react';
import {
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
} from '@chakra-ui/react/dialog';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { JsonCard } from '../../../components/JsonCard';
import { JsonValue } from '../../types';
import type { SchemaEditorVM } from '../../vm/SchemaEditorVM';

interface CreateTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  viewModel: SchemaEditorVM;
  isLoading?: boolean;
}

export const CreateTableDialog: FC<CreateTableDialogProps> = observer(
  ({ isOpen, onClose, onApprove, viewModel, isLoading }) => {
    const viewMode = viewModel.createDialogViewMode;

    return (
      <DialogRoot
        open={isOpen}
        onOpenChange={({ open }) => !open && onClose()}
        size="lg"
      >
        <Portal>
          <DialogBackdrop />
          <DialogPositioner>
            <DialogContent maxWidth="700px">
              <DialogHeader>
                <DialogTitle>Create Table "{viewModel.tableId}"</DialogTitle>
              </DialogHeader>

              <DialogBody>
                <VStack align="stretch" gap={4}>
                  <SegmentGroup.Root
                    size="sm"
                    value={viewMode}
                    onValueChange={(details) =>
                      viewModel.setCreateDialogViewMode(
                        details.value as 'Example' | 'Schema',
                      )
                    }
                  >
                    <SegmentGroup.Indicator />
                    <SegmentGroup.Items items={['Example', 'Schema']} />
                  </SegmentGroup.Root>
                  <Box
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    overflow="hidden"
                    maxHeight="400px"
                    overflowY="auto"
                  >
                    {viewMode === 'Example' ? (
                      <JsonCard
                        readonly
                        data={viewModel.getExampleData() as JsonValue}
                      />
                    ) : (
                      <JsonCard
                        readonly
                        data={
                          viewModel.getPlainSchema() as unknown as JsonValue
                        }
                      />
                    )}
                  </Box>
                </VStack>
              </DialogBody>

              <DialogFooter>
                <Button variant="plain" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="plain" onClick={onApprove} loading={isLoading}>
                  Create Table
                </Button>
              </DialogFooter>

              <DialogCloseTrigger />
            </DialogContent>
          </DialogPositioner>
        </Portal>
      </DialogRoot>
    );
  },
);
