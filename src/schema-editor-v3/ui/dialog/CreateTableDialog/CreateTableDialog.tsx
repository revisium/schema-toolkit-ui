import { Box, SegmentGroup, VStack } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC } from 'react';
import { JsonCard } from '../../../../components/JsonCard';
import type { CreateTableDialogVM } from '../../../model/dialog';
import type { JsonValue } from '../../../types';
import { DialogLayout, DialogFooterActions } from '../shared';

interface CreateTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vm: CreateTableDialogVM;
}

export const CreateTableDialog: FC<CreateTableDialogProps> = observer(
  ({ isOpen, onClose, vm }) => {
    return (
      <DialogLayout
        isOpen={isOpen}
        onClose={onClose}
        title={`Create Table "${vm.tableId}"`}
        footer={
          <DialogFooterActions
            onCancel={onClose}
            onConfirm={vm.approve}
            confirmLabel="Create Table"
            confirmLoading={vm.loading}
          />
        }
      >
        <VStack align="stretch" gap={4}>
          <SegmentGroup.Root
            size="sm"
            value={vm.viewMode}
            onValueChange={(details) =>
              vm.setViewMode(details.value as 'Example' | 'Schema')
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
            {vm.viewMode === 'Example' ? (
              <JsonCard readonly data={(vm.exampleData ?? null) as JsonValue} />
            ) : (
              <JsonCard readonly data={(vm.plainSchema ?? null) as JsonValue} />
            )}
          </Box>
        </VStack>
      </DialogLayout>
    );
  },
);
